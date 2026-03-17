#!/bin/bash
##############################################################################
# Claude Code 循环审查 & 优化脚本
#
# 每轮只调用一次 Claude Code，一次性完成：审查 → 修复 → 验证 → 总结
# 支持：收敛检测自动退出 | 维度轮换聚焦 | 中断安全
#       指数退避重试 | 成本统计 | 结构化上下文传递
# 注意：本脚本不会在轮间自动提交 Git，所有修改保留在工作区
#
# 用法：
#   chmod +x tools/code-review/claude-loop.sh
#   ./tools/code-review/claude-loop.sh [项目根目录] [最大轮数] [--dry-run]
#
# 示例：
#   ./tools/code-review/claude-loop-nocommit.sh . 5
#   ./tools/code-review/claude-loop-nocommit.sh . 5 --dry-run   # 只审查不修复
##############################################################################

set -euo pipefail

# ======================== 配置 ========================

# 解析参数：支持 --dry-run 标志
DRY_RUN=false
POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done

# 将项目路径解析为绝对路径，避免 cd 后相对路径失效
# 使用 ${POSITIONAL[0]+...} 语法避免 set -u 下数组为空报错
PROJECT_DIR="$(cd "${POSITIONAL[0]+${POSITIONAL[0]}}" 2>/dev/null && pwd || pwd)"
MAX_ROUNDS="${POSITIONAL[1]+${POSITIONAL[1]}}"
MAX_ROUNDS="${MAX_ROUNDS:-20}"
REPORT_DIR="${PROJECT_DIR}/.arch-review"
COOLDOWN=12
MAX_TURNS=50
MAX_RETRY=3
TS=$(date +%Y%m%d_%H%M%S)
RUN_DIR="${REPORT_DIR}/run_${TS}"

# 全局变量（trap 中断处理需要访问，不能是 local）
done_rounds=0
total_elapsed=0
total_input_tokens=0
total_output_tokens=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
log_err()   { echo -e "${RED}[✗]${NC} $*"; }
log_phase() { echo -e "\n${CYAN}━━━ $* ━━━${NC}\n"; }

# ======================== 维度轮换 ========================
# 4 组维度循环，避免相邻轮次重复同一维度

dimensions_for_round() {
  local round=$1
  case $(( (round - 1) % 4 )) in
    0) echo "架构合理性、类型安全、依赖管理" ;;
    1) echo "代码质量、错误处理、性能优化" ;;
    2) echo "命名规范、重复代码、安全隐患" ;;
    3) echo "测试覆盖、性能优化、架构合理性" ;;
  esac
}

effort_for_round() {
  local round=$1
  # 前 3 轮用 max 深度扫描，之后用 high 省成本
  if (( round <= 3 )); then
    echo "max"
  else
    echo "high"
  fi
}

# ======================== 收敛检测 ========================

check_convergence() {
  local report=$1
  # 空文件或不存在 → 不算收敛（可能是执行失败）
  [ ! -s "$report" ] && return 1

  # 检测机器可读的收敛标记（由 Claude 在报告末尾输出）
  if grep -q '<!-- CONVERGED -->' "$report"; then
    return 0
  fi

  # 兜底：检测「已修复」部分是否仅有独占一行的「无」
  # 用严格正则避免误匹配含「无」的修复描述（如「无用代码删除」）
  if grep -qE '^## 已修复' "$report" && \
     sed -n '/^## 已修复/,/^## /p' "$report" | grep -qE '^-?\s*无\s*$'; then
    return 0
  fi

  return 1
}

# ======================== 提取报告关键段落 ========================

extract_report_sections() {
  local report=$1
  [ ! -s "$report" ] && return

  # 提取「已修复」和「遗留问题」两个 section，跳过冗长的分析过程
  sed -n '/^## 已修复/,/^## 下轮建议/p' "$report" | head -60
}

# ======================== 成本统计 ========================

parse_and_accumulate_tokens() {
  local json_file=$1
  [ ! -s "$json_file" ] && return

  # 单次读取 JSON 提取 input/output token 用量，避免重复解析
  local tokens
  tokens=$(python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    u = data.get('usage', {})
    print(u.get('input_tokens', 0), u.get('output_tokens', 0))
except: print('0 0')
" < "$json_file" 2>/dev/null) || tokens="0 0"

  local input output
  read -r input output <<< "$tokens"
  total_input_tokens=$(( total_input_tokens + input ))
  total_output_tokens=$(( total_output_tokens + output ))
}

# ======================== 动态冷却 ========================

smart_cooldown() {
  local elapsed=$1
  local round=$2

  # 最后一轮不需要冷却
  [ "$round" -ge "$MAX_ROUNDS" ] && return 0

  if [ "$elapsed" -lt 30 ]; then
    # 异常快速返回（可能出错了），多等一会儿避免连续触发限流
    log_info "本轮耗时过短（${elapsed}s），冷却 30s..."
    sleep 30
  elif [ "$elapsed" -lt 120 ]; then
    log_info "冷却 ${COOLDOWN}s..."
    sleep "$COOLDOWN"
  fi
  # 超过 2 分钟无需冷却，API 限流窗口已自然过渡
}

# ======================== 单轮审查（带重试） ========================

run_round() {
  local round=$1
  local report="${RUN_DIR}/round_${round}.md"
  local json_out="${RUN_DIR}/round_${round}.json"
  local errlog="${RUN_DIR}/round_${round}.err"
  local dims
  dims=$(dimensions_for_round "$round")
  local effort
  effort=$(effort_for_round "$round")

  # 提取上一轮关键段落（已修复 + 遗留问题），避免传递冗余内容
  local prev_context=""
  if [ "$round" -gt 1 ]; then
    local prev="${RUN_DIR}/round_$((round - 1)).md"
    if [ -s "$prev" ]; then
      local sections
      sections=$(extract_report_sections "$prev")
      if [ -n "$sections" ]; then
        prev_context="
## 上一轮审查记录（请对比改进，不要重复已修复的问题）
${sections}"
      fi
    fi
  fi

  # dry-run 模式下追加「只审查不修复」指令
  local dry_run_instruction=""
  if [ "$DRY_RUN" = true ]; then
    dry_run_instruction="

## ⚠️ DRY-RUN 模式
本轮仅执行 STEP 1（扫描发现问题）和 STEP 4（输出报告），**不要修改任何文件**。跳过 STEP 2 和 STEP 3。"
  fi

  log_phase "第 ${round}/${MAX_ROUNDS} 轮 | 聚焦: ${dims} | effort: ${effort}$( [ "$DRY_RUN" = true ] && echo ' | DRY-RUN' )"

  # 确保报告目录存在（上一轮 Claude 可能误删）
  mkdir -p "$RUN_DIR"

  # 指数退避重试
  local attempt=0
  while (( attempt < MAX_RETRY )); do
    claude --dangerously-skip-permissions \
      --model claude-opus-4-6 \
      --effort "$effort" \
      --max-turns "$MAX_TURNS" \
      -p "你是一位追求极致优雅的资深软件架构师。对项目 ${PROJECT_DIR} 执行第 ${round} 轮 code review 并直接修复。

**重要：请先阅读项目根目录的 CLAUDE.md，严格遵守其中的所有规则。**

## 本轮聚焦维度

${dims}

各维度含义：
- **架构合理性** — 模块划分、职责单一、依赖方向、层次清晰
- **代码质量** — 函数长度、圈复杂度、可读性、DRY 原则
- **类型安全** — 消灭 any、完善泛型、严格类型推断
- **错误处理** — async/await 异常捕获、错误边界、用户友好提示
- **性能优化** — 不必要的重渲染、大数据处理、懒加载与代码分割
- **安全隐患** — 敏感信息泄露、输入校验、XSS/注入防护
- **依赖管理** — 循环依赖、版本一致性、无用依赖清理
- **命名规范** — 变量/函数/文件命名清晰表达意图、风格统一
- **重复代码** — 识别并抽取公共逻辑到公共包
- **测试覆盖** — 关键路径是否有测试、边界条件覆盖

## 修复原则（极其重要，必须严格遵守）

- **直接收敛**：不要添加兼容层、适配器、wrapper 来绕过问题，而是直接修正根因
- **减法优先**：删除冗余代码、无用的中间抽象、过度封装，代码越少越好
- **优雅实现**：用语言特性和框架能力直接表达意图，拒绝 boilerplate
- **最小改动**：每次只改必要的部分，确保不破坏现有功能
- **一步到位**：修复要彻底，不留 TODO、不留临时方案
- **禁区**：绝不修改或删除 \`.arch-review/\` 目录及其内容，那是审查报告存储区
${dry_run_instruction}
## 工作流程

请严格按顺序执行：

**STEP 1 — 扫描发现问题**
遍历项目关键文件，按本轮聚焦维度逐一检查，记录问题清单。

**STEP 2 — 直接修复**
对发现的问题按优先级（P0→P1→P2）逐一修复文件。修复时直接改代码，不要只给建议。

**STEP 3 — 验证**
修复后运行类型检查（npx tsc --noEmit）和 lint（pnpm lint），确认无新错误。

**STEP 4 — 输出报告**
以 Markdown 格式输出本轮审查报告（直接输出到 stdout，不要用工具写文件），使用以下结构：

# 第 ${round} 轮审查报告

## 已修复
- [P0/P1/P2] \`文件路径\`: 问题简述 → 修复方式

## 遗留问题
- [优先级] 问题描述（未修复原因）

## 下轮建议
重点关注方向

如果本轮未发现任何需要修复的问题，在「已修复」部分写「无」，并在报告最末尾单独一行输出 \`<!-- CONVERGED -->\` 标记。
${prev_context}" \
      --output-format json \
      2>"$errlog" > "$json_out" && break

    attempt=$((attempt + 1))
    if (( attempt < MAX_RETRY )); then
      local wait=$(( 30 * attempt ))
      log_warn "第 ${round} 轮失败，${wait}s 后重试（${attempt}/${MAX_RETRY}）"
      sleep "$wait"
    fi
  done

  # 全部重试用尽仍失败
  if (( attempt >= MAX_RETRY )); then
    log_err "第 ${round} 轮经 ${MAX_RETRY} 次尝试后仍失败"
    [ -s "$errlog" ] && log_err "错误详情: $(head -5 "$errlog")"
    return 1
  fi

  # 从 JSON 输出中提取文本内容和 token 用量
  if [ -s "$json_out" ]; then
    # 提取 result 文本作为报告
    python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('result', ''))
except:
    sys.exit(1)
" < "$json_out" > "$report" 2>/dev/null || {
      # JSON 解析失败，直接把原始输出当报告用
      cp "$json_out" "$report"
    }
    parse_and_accumulate_tokens "$json_out"
  fi

  log_ok "报告已保存: $report"
  if [ -s "$errlog" ]; then
    log_warn "stderr 日志: $errlog"
  fi
}

# ======================== 最终报告 ========================

final_report() {
  local total=$1
  local final="${RUN_DIR}/FINAL_REPORT.md"

  [ "$total" -eq 0 ] && { log_warn "无审查轮次，跳过最终报告"; return; }

  # 确保报告目录存在
  mkdir -p "$RUN_DIR"

  # 只提取每轮关键段落，避免拼接全文超 token
  local summaries=""
  for ((i=1; i<=total; i++)); do
    local r="${RUN_DIR}/round_${i}.md"
    if [ -s "$r" ]; then
      local sections
      sections=$(extract_report_sections "$r")
      summaries="${summaries}
---
### 第 ${i} 轮
${sections:-（报告为空）}
"
    fi
  done

  claude --dangerously-skip-permissions \
    --model claude-opus-4-6 \
    --effort high \
    --max-turns 10 \
    -p "基于以下 ${total} 轮架构审查记录，生成最终报告。

${summaries}

## 报告结构

# 架构审查最终报告

## 1. 执行摘要
审查轮数、问题总数、修复总数、健康度变化趋势

## 2. 关键改进 TOP 5
最有价值的 5 项修复

## 3. 架构评估
整体设计、可扩展性、可维护性评价

## 4. 遗留技术债
未解决的问题及建议处理时间线

## 5. 行动计划
按优先级排列的后续 TODO" \
    --output-format text \
    2>"${RUN_DIR}/final.err" > "$final" || {
      log_warn "最终报告生成失败"
      [ -s "${RUN_DIR}/final.err" ] && log_err "$(head -3 "${RUN_DIR}/final.err")"
    }

  log_ok "最终报告: $final"
}

# ======================== 统计摘要 ========================

print_summary() {
  local rounds=$1
  local elapsed=$2
  local mins=$(( elapsed / 60 ))
  local secs=$(( elapsed % 60 ))

  log_phase "完成"
  log_info "共 ${rounds} 轮 | 总耗时 ${mins}m${secs}s | 报告目录: ${RUN_DIR}"

  # 成本估算（基于 token 用量）
  if (( total_input_tokens > 0 || total_output_tokens > 0 )); then
    # Opus 定价：输入 $15/MTok，输出 $75/MTok
    local cost
    cost=$(python3 -c "
input_cost = ${total_input_tokens} / 1_000_000 * 15
output_cost = ${total_output_tokens} / 1_000_000 * 75
print(f'{input_cost + output_cost:.2f}')
" 2>/dev/null || echo "N/A")
    log_info "Token 用量: 输入 ${total_input_tokens} | 输出 ${total_output_tokens} | 估算费用 \$${cost}"
  fi

  for f in "${RUN_DIR}"/*.md; do
    [ -f "$f" ] && echo "  $f"
  done
  log_ok "请查看 ${RUN_DIR}/FINAL_REPORT.md"
}

# ======================== 中断处理 ========================

on_interrupt() {
  echo ""
  log_warn "收到中断信号，正在生成部分报告..."
  final_report "$done_rounds"
  print_summary "$done_rounds" "$total_elapsed"
  exit 130
}

trap on_interrupt INT TERM

# ======================== 主流程 ========================

main() {
  log_phase "架构师审查循环启动"

  command -v claude &>/dev/null || { log_err "请先安装 Claude Code: npm i -g @anthropic-ai/claude-code"; exit 1; }
  command -v python3 &>/dev/null || { log_err "需要 python3 用于解析 JSON 输出"; exit 1; }
  [ -d "$PROJECT_DIR" ] || { log_err "目录不存在: $PROJECT_DIR"; exit 1; }

  cd "$PROJECT_DIR"
  mkdir -p "$RUN_DIR"

  # 确保报告目录不被 git 跟踪
  if [ ! -f "${REPORT_DIR}/.gitignore" ]; then
    echo "*" > "${REPORT_DIR}/.gitignore"
  fi

  log_info "项目: ${PROJECT_DIR}"
  log_info "轮数: 最多 ${MAX_ROUNDS} 轮（支持收敛提前退出）"
  log_info "模式: $( [ "$DRY_RUN" = true ] && echo 'DRY-RUN（只审查不修复）' || echo '审查+修复' )"
  log_info "报告: ${RUN_DIR}"

  # 安全确认
  log_warn "本脚本将以 --dangerously-skip-permissions 模式运行 Claude Code"
  log_warn "Claude 将拥有完整的文件读写和命令执行权限"
  read -rp "确认继续？(y/N) " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { log_info "已取消"; exit 0; }

  local run_start
  run_start=$(date +%s)

  for ((r=1; r<=MAX_ROUNDS; r++)); do
    local t0
    t0=$(date +%s)

    # run_round 失败时跳过本轮的提交和收敛检测
    if ! run_round "$r"; then
      log_warn "本轮异常，跳过收敛检测，继续下一轮"
      done_rounds=$r
      local elapsed=$(( $(date +%s) - t0 ))
      total_elapsed=$(( $(date +%s) - run_start ))
      smart_cooldown "$elapsed" "$r"
      continue
    fi

    done_rounds=$r
    local elapsed=$(( $(date +%s) - t0 ))
    total_elapsed=$(( $(date +%s) - run_start ))
    log_info "本轮耗时 ${elapsed}s | 累计 $(( total_elapsed / 60 ))m$(( total_elapsed % 60 ))s"

    # 收敛检测：本轮无新修复则提前退出
    if check_convergence "${RUN_DIR}/round_${r}.md"; then
      log_ok "已收敛：本轮无新修复，提前退出"
      break
    fi

    # 动态冷却
    smart_cooldown "$elapsed" "$r"
  done

  total_elapsed=$(( $(date +%s) - run_start ))
  final_report "$done_rounds"
  print_summary "$done_rounds" "$total_elapsed"
}

main "$@"
