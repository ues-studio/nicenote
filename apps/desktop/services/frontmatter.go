package services

import (
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// frontmatterData YAML frontmatter 的结构体，用于解析
type frontmatterData struct {
	Tags    []string `yaml:"tags"`
	Created string   `yaml:"created"`
}

// ParseFrontmatter 解析 .md 文件内容，提取 YAML frontmatter 中的标签、创建时间和正文
// 格式：
//
//	---
//	tags: [工作, 想法]
//	created: 2025-01-15T10:00:00
//	---
//
//	# 正文内容
func ParseFrontmatter(raw string) (tags []string, created string, body string) {
	tags = []string{}
	created = ""
	body = raw

	// 必须以 "---\n" 开头才视为有 frontmatter
	const delimiter = "---"
	if !strings.HasPrefix(raw, delimiter) {
		return
	}

	// 找到结束分隔符
	rest := raw[len(delimiter):]
	// 跳过开头分隔符后紧跟的换行
	if len(rest) > 0 && rest[0] == '\n' {
		rest = rest[1:]
	} else if len(rest) > 0 && rest[0] == '\r' && len(rest) > 1 && rest[1] == '\n' {
		rest = rest[2:]
	}

	// 查找结束分隔符
	endIdx := strings.Index(rest, "\n---")
	if endIdx == -1 {
		// 没有有效的结束分隔符，当作普通内容处理
		return
	}

	yamlContent := rest[:endIdx]
	afterFrontmatter := rest[endIdx+4:] // 跳过 "\n---"

	// 跳过结束分隔符后的换行
	if len(afterFrontmatter) > 0 && afterFrontmatter[0] == '\n' {
		afterFrontmatter = afterFrontmatter[1:]
	} else if len(afterFrontmatter) > 0 && afterFrontmatter[0] == '\r' && len(afterFrontmatter) > 1 && afterFrontmatter[1] == '\n' {
		afterFrontmatter = afterFrontmatter[2:]
	}

	// 解析 YAML
	var fm frontmatterData
	if err := yaml.Unmarshal([]byte(yamlContent), &fm); err != nil {
		// YAML 解析失败，返回原始内容
		return
	}

	if fm.Tags != nil {
		tags = fm.Tags
	}
	created = fm.Created
	body = afterFrontmatter
	return
}

// WriteFrontmatter 将标签、创建时间和正文组合成带 frontmatter 的完整文件内容
// 若 tags 为空且 created 为空，则直接返回 body（不生成 frontmatter）
func WriteFrontmatter(tags []string, created string, body string) string {
	// 若没有任何 frontmatter 数据，直接返回正文
	hasTags := len(tags) > 0
	hasCreated := created != ""
	if !hasTags && !hasCreated {
		return body
	}

	// 确保 created 有值
	if !hasCreated {
		created = time.Now().Format(time.RFC3339)
	}

	fm := frontmatterData{
		Tags:    tags,
		Created: created,
	}

	yamlBytes, err := yaml.Marshal(&fm)
	if err != nil {
		// 序列化失败，退化为不带 frontmatter 的纯正文
		return body
	}

	var sb strings.Builder
	sb.WriteString("---\n")
	sb.Write(yamlBytes)
	sb.WriteString("---\n\n")
	sb.WriteString(body)
	return sb.String()
}
