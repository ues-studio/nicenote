use crate::services::note_io::{self, FolderNode, NoteContent, NoteFile};

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
    note_io::save_note(&path, &content, &tags).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(folder_path: String) -> Result<NoteFile, String> {
    note_io::create_note(&folder_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_note(old_path: String, new_title: String) -> Result<NoteFile, String> {
    note_io::rename_note(&old_path, &new_title).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_note(path: String) -> Result<(), String> {
    note_io::delete_note(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_folder_tree(root_path: String) -> Result<FolderNode, String> {
    note_io::get_folder_tree(&root_path).map_err(|e| e.to_string())
}
