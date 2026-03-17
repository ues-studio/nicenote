use std::path::Path;

use serde::{Deserialize, Serialize};

/// 笔记 frontmatter 结构（YAML）
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Frontmatter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
}

/// 解析 Markdown 文件，分离 frontmatter 和正文
/// 返回 (Frontmatter, 正文字符串)
pub fn parse(raw: &str) -> (Frontmatter, String) {
    let raw = raw.trim_start_matches('\u{feff}'); // 去除 BOM

    if !raw.starts_with("---") {
        return (Frontmatter::default(), raw.to_string());
    }

    // 找到第二个 --- 分隔符（跳过第一个）
    let after_first = &raw[3..];
    let Some(end_pos) = after_first.find("\n---") else {
        return (Frontmatter::default(), raw.to_string());
    };

    let yaml_str = after_first[..end_pos].trim_start_matches('\n');
    let body_start = end_pos + 4; // "\n---" 长度
    let body = after_first[body_start..].trim_start_matches('\n').to_string();

    let fm: Frontmatter = serde_yaml::from_str(yaml_str).unwrap_or_default();
    (fm, body)
}

/// 将 frontmatter 和正文序列化为完整 Markdown 文件内容
pub fn write(fm: &Frontmatter, body: &str) -> String {
    let yaml = serde_yaml::to_string(fm).unwrap_or_default();
    // serde_yaml 会输出 "---\n" 开头，去掉它
    let yaml_content = yaml.trim_start_matches("---\n").trim_end_matches('\n');
    format!("---\n{}\n---\n\n{}", yaml_content, body)
}

/// 从 frontmatter 和文件名推导展示标题
/// 优先使用 frontmatter 中的 title，为空时回退到文件名
fn resolve_title(fm: &Frontmatter, filename_stem: &str) -> String {
    fm.title
        .clone()
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| filename_stem.to_string())
}

/// 从文件路径提取标题：优先使用 frontmatter title，回退到文件名 stem
pub fn resolve_title_from_path(fm: &Frontmatter, path: &Path) -> String {
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");
    resolve_title(fm, stem)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_with_frontmatter() {
        let raw = "---\ntitle: 测试笔记\ntags:\n  - rust\n  - tauri\ncreated_at: '2024-01-01'\n---\n\n正文内容";
        let (fm, body) = parse(raw);
        assert_eq!(fm.title.as_deref(), Some("测试笔记"));
        assert_eq!(fm.tags, vec!["rust", "tauri"]);
        assert_eq!(body, "正文内容");
    }

    #[test]
    fn test_parse_without_frontmatter() {
        let raw = "# 普通笔记\n\n内容";
        let (fm, body) = parse(raw);
        assert!(fm.title.is_none());
        assert!(fm.tags.is_empty());
        assert_eq!(body, "# 普通笔记\n\n内容");
    }

    #[test]
    fn test_write_roundtrip() {
        let fm = Frontmatter {
            title: Some("测试".to_string()),
            tags: vec!["tag1".to_string()],
            created_at: Some("2024-01-01".to_string()),
        };
        let body = "正文";
        let written = write(&fm, body);
        let (parsed_fm, parsed_body) = parse(&written);
        assert_eq!(parsed_fm.title.as_deref(), Some("测试"));
        assert_eq!(parsed_fm.tags, vec!["tag1"]);
        assert_eq!(parsed_body, body);
    }
}
