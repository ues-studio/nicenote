use tauri::State;

use crate::services::search_engine::{self, SearchResult};
use crate::AppState;

/// 搜索查询最大长度（与前端 Zod schema 保持一致）
const MAX_QUERY_LENGTH: usize = 200;
/// 搜索结果最大返回数（与前端 noteSearchQuerySchema.limit 上限一致）
const MAX_SEARCH_RESULTS: usize = 50;

/// 搜索笔记：优先使用内存索引，如果索引为空则回退到文件系统扫描
#[tauri::command]
pub fn search_notes(
    folder_path: String,
    query: String,
    state: State<AppState>,
) -> Result<Vec<SearchResult>, String> {
    if query.chars().count() > MAX_QUERY_LENGTH {
        return Err(format!("搜索关键词超过最大长度（{MAX_QUERY_LENGTH} 字符）"));
    }
    let index = state.search_index.read();

    // 索引已构建（watch_folder 已调用），直接使用索引结果
    if index.is_initialized() {
        return Ok(index.search(&query, MAX_SEARCH_RESULTS));
    }
    drop(index);

    // 回退：索引尚未构建，使用文件系统扫描
    search_engine::search_notes(&folder_path, &query, MAX_SEARCH_RESULTS).map_err(|e| e.to_string())
}
