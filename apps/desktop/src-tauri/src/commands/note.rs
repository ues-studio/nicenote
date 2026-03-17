use crate::services::note_io::{self, FolderNode, NoteContent, NoteFile};

/// 内容最大长度（字符数，与前端 Zod schema 保持一致）
const MAX_CONTENT_LENGTH: usize = 100_000;
/// 单个笔记最大标签数
const MAX_TAGS_COUNT: usize = 50;
/// 单个标签最大长度
const MAX_TAG_LENGTH: usize = 50;
/// 标题最大长度
const MAX_TITLE_LENGTH: usize = 500;

#[tauri::command]
pub fn list_notes(folder_path: String) -> Result<Vec<NoteFile>, String> {
    note_io::list_notes(&folder_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_note_content(path: String) -> Result<NoteContent, String> {
    note_io::get_note_content(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_note(path: String, content: String, tags: Vec<String>) -> Result<(), String> {
    if content.chars().count() > MAX_CONTENT_LENGTH {
        return Err(format!("内容超过最大长度限制（{MAX_CONTENT_LENGTH} 字符）"));
    }
    if tags.len() > MAX_TAGS_COUNT {
        return Err(format!("标签数量超过上限（最多 {MAX_TAGS_COUNT} 个）"));
    }
    if let Some(t) = tags.iter().find(|t| t.chars().count() > MAX_TAG_LENGTH) {
        let preview: String = t.chars().take(20).collect();
        return Err(format!(
            "标签 \"{preview}\" 超过最大长度（{MAX_TAG_LENGTH} 字符）",
        ));
    }
    note_io::save_note(&path, &content, &tags).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(folder_path: String) -> Result<NoteFile, String> {
    note_io::create_note(&folder_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_note(old_path: String, new_title: String) -> Result<NoteFile, String> {
    let title_trimmed = new_title.trim();
    if title_trimmed.is_empty() {
        return Err("标题不能为空".to_string());
    }
    if title_trimmed.chars().count() > MAX_TITLE_LENGTH {
        return Err(format!("标题超过最大长度限制（{MAX_TITLE_LENGTH} 字符）"));
    }
    note_io::rename_note(&old_path, title_trimmed).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_note(path: String) -> Result<(), String> {
    note_io::delete_note(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_folder_tree(root_path: String) -> Result<FolderNode, String> {
    note_io::get_folder_tree(&root_path).map_err(|e| e.to_string())
}
