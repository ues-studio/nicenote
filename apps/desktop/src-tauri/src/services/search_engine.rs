use std::fs;
use std::path::Path;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

use super::frontmatter;
use super::utils::{format_modified_time, is_hidden_entry, is_markdown_file, validate_folder_path};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub path: String,
    pub title: String,
    pub snippet: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// 在 folder_path 内全文搜索（标题 + 正文，大小写不敏感）
/// max_results 限制返回的最大结果数
pub fn search_notes(folder_path: &str, query: &str, max_results: usize) -> Result<Vec<SearchResult>> {
    validate_folder_path(folder_path)?;
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for entry in WalkDir::new(folder_path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if is_hidden_entry(entry.file_name(), path, Path::new(folder_path)) {
            continue;
        }
        if !is_markdown_file(path) {
            continue;
        }

        let raw = match fs::read_to_string(path) {
            Ok(s) => s,
            Err(_) => continue,
        };
        let (fm, body) = frontmatter::parse(&raw);

        let title = frontmatter::resolve_title_from_path(&fm, path);

        let Some(snippet) = match_note(&title, &body, &query_lower) else {
            continue;
        };

        let updated_at = format_modified_time(path);
        let created_at = fm.created_at.clone().unwrap_or_else(|| updated_at.clone());

        results.push(SearchResult {
            path: path.to_string_lossy().to_string(),
            title,
            snippet,
            tags: fm.tags,
            created_at,
            updated_at,
        });
    }

    sort_by_title_match(&mut results, &query_lower);
    results.truncate(max_results);

    Ok(results)
}

/// 尝试匹配标题或正文，返回匹配的摘要片段；无匹配时返回 None
/// 供 search_engine 和 search_index 共用，避免搜索匹配逻辑重复
pub fn match_note(title: &str, body: &str, query_lower: &str) -> Option<String> {
    let title_lower = title.to_lowercase();
    let title_match = title_lower.contains(query_lower);

    if title_match {
        Some(body.chars().take(120).collect())
    } else {
        let body_lower = body.to_lowercase();
        if !body_lower.contains(query_lower) {
            return None;
        }
        Some(extract_snippet(body, &body_lower, query_lower))
    }
}

/// 按标题命中优先排序搜索结果
/// 使用 sort_by_cached_key 缓存 to_lowercase() 结果，避免比较器中反复分配
pub fn sort_by_title_match(results: &mut [SearchResult], query_lower: &str) {
    results.sort_by_cached_key(|r| std::cmp::Reverse(r.title.to_lowercase().contains(query_lower)));
}

/// 从正文中提取命中关键词的上下文片段
/// body_lower 由调用方预先计算，避免重复 to_lowercase() 分配
fn extract_snippet(body: &str, body_lower: &str, query_lower: &str) -> String {
    if let Some(pos) = body_lower.find(query_lower) {
        let start = pos.saturating_sub(60);
        let end = (pos + query_lower.len() + 60).min(body.len());
        // 对齐 UTF-8 字符边界（向前找有效起点，向后找有效终点）
        let start = (0..=start).rev().find(|&i| body.is_char_boundary(i)).unwrap_or(0);
        let end = (end..=body.len()).find(|&i| body.is_char_boundary(i)).unwrap_or(body.len());
        let trimmed = body[start..end].trim();
        let prefix = if start > 0 { "..." } else { "" };
        let suffix = if end < body.len() { "..." } else { "" };
        format!("{}{}{}", prefix, trimmed, suffix)
    } else {
        // 标题命中但正文不含关键词，返回正文开头
        body.chars().take(120).collect()
    }
}
