use std::collections::HashMap;
use std::fs;
use std::path::Path;

use walkdir::WalkDir;

use super::frontmatter;
use super::search_engine::{match_note, sort_by_title_match, SearchResult};
use super::utils::{format_modified_time, is_hidden_entry, is_markdown_file};

/// 索引条目：缓存每个 .md 文件的元数据和文本内容
#[derive(Debug, Clone)]
pub struct IndexEntry {
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// 内存搜索索引：以文件路径为键
#[derive(Debug, Default)]
pub struct SearchIndex {
    entries: HashMap<String, IndexEntry>,
    /// 标记索引是否已通过 build() 构建，用于区分"未初始化"和"查询无匹配"
    initialized: bool,
}

impl SearchIndex {
    /// 索引是否已构建（区分"未初始化"和"查询无匹配"）
    pub fn is_initialized(&self) -> bool {
        self.initialized
    }

    /// 扫描 folder_path 下的所有 .md 文件，构建索引
    pub fn build(folder_path: &str) -> Self {
        let mut index = Self { initialized: true, ..Self::default() };
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
            index.upsert(path);
        }
        index
    }

    /// 插入或更新一个文件的索引条目
    pub fn upsert(&mut self, path: &Path) {
        let raw = match fs::read_to_string(path) {
            Ok(s) => s,
            Err(_) => return,
        };
        let (fm, body) = frontmatter::parse(&raw);

        let title = frontmatter::resolve_title_from_path(&fm, path);

        let updated_at = format_modified_time(path);
        let created_at = fm.created_at.clone().unwrap_or_else(|| updated_at.clone());

        self.entries.insert(
            path.to_string_lossy().to_string(),
            IndexEntry {
                title,
                body,
                tags: fm.tags,
                created_at,
                updated_at,
            },
        );
    }

    /// 删除一个文件的索引条目
    pub fn remove(&mut self, path: &str) {
        self.entries.remove(path);
    }

    /// 在索引中搜索（大小写不敏感），返回最多 max_results 条匹配结果
    pub fn search(&self, query: &str, max_results: usize) -> Vec<SearchResult> {
        if query.trim().is_empty() {
            return vec![];
        }
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();

        for (path, entry) in &self.entries {
            let Some(snippet) = match_note(&entry.title, &entry.body, &query_lower) else {
                continue;
            };

            results.push(SearchResult {
                path: path.clone(),
                title: entry.title.clone(),
                snippet,
                tags: entry.tags.clone(),
                created_at: entry.created_at.clone(),
                updated_at: entry.updated_at.clone(),
            });
        }

        sort_by_title_match(&mut results, &query_lower);
        results.truncate(max_results);

        results
    }
}
