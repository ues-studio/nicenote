use crate::services::search_engine::{self, SearchResult};

#[tauri::command]
pub fn search_notes(folder_path: String, query: String) -> Result<Vec<SearchResult>, String> {
    search_engine::search_notes(&folder_path, &query).map_err(|e| e.to_string())
}
