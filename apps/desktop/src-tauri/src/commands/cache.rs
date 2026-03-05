use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub theme: String,
    pub language: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "zh".to_string(),
        }
    }
}

// ---- 最近文件夹 ----

#[tauri::command]
pub fn get_recent_folders(state: State<AppState>) -> Result<Vec<String>, String> {
    let conn = state.db.lock();
    let mut stmt = conn
        .prepare("SELECT path FROM recent_folders ORDER BY accessed_at DESC LIMIT 20")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.map(|r| r.map_err(|e| e.to_string())).collect()
}

#[tauri::command]
pub fn add_recent_folder(state: State<AppState>, path: String) -> Result<(), String> {
    let conn = state.db.lock();
    conn.execute(
        "INSERT INTO recent_folders (path, accessed_at) VALUES (?1, datetime('now'))
         ON CONFLICT(path) DO UPDATE SET accessed_at = datetime('now')",
        [&path],
    )
    .map_err(|e| e.to_string())?;
    // 只保留最近 20 条
    conn.execute(
        "DELETE FROM recent_folders WHERE path NOT IN (
             SELECT path FROM recent_folders ORDER BY accessed_at DESC LIMIT 20
         )",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ---- 设置 ----

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<Settings, String> {
    let conn = state.db.lock();
    let theme = get_setting(&conn, "theme").unwrap_or_else(|| "system".to_string());
    let language = get_setting(&conn, "language").unwrap_or_else(|| "zh".to_string());
    Ok(Settings { theme, language })
}

#[tauri::command]
pub fn save_settings(state: State<AppState>, settings: Settings) -> Result<(), String> {
    let conn = state.db.lock();
    set_setting(&conn, "theme", &settings.theme).map_err(|e| e.to_string())?;
    set_setting(&conn, "language", &settings.language).map_err(|e| e.to_string())?;
    Ok(())
}

fn get_setting(conn: &rusqlite::Connection, key: &str) -> Option<String> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get(0),
    )
    .ok()
}

fn set_setting(conn: &rusqlite::Connection, key: &str, value: &str) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = ?2",
        [key, value],
    )?;
    Ok(())
}

// ---- 标签颜色 ----

#[tauri::command]
pub fn get_tag_colors(state: State<AppState>) -> Result<HashMap<String, String>, String> {
    let conn = state.db.lock();
    let mut stmt = conn
        .prepare("SELECT tag, color FROM tag_colors")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    let mut map = HashMap::new();
    for r in rows {
        let (tag, color) = r.map_err(|e| e.to_string())?;
        map.insert(tag, color);
    }
    Ok(map)
}

#[tauri::command]
pub fn set_tag_color(state: State<AppState>, tag: String, color: String) -> Result<(), String> {
    let conn = state.db.lock();
    conn.execute(
        "INSERT INTO tag_colors (tag, color) VALUES (?1, ?2)
         ON CONFLICT(tag) DO UPDATE SET color = ?2",
        [&tag, &color],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ---- 收藏夹 ----

#[tauri::command]
pub fn get_favorites(state: State<AppState>) -> Result<Vec<String>, String> {
    let conn = state.db.lock();
    let mut stmt = conn
        .prepare("SELECT path FROM favorites ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.map(|r| r.map_err(|e| e.to_string())).collect()
}

#[tauri::command]
pub fn toggle_favorite(state: State<AppState>, path: String) -> Result<(), String> {
    let conn = state.db.lock();
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM favorites WHERE path = ?1",
            [&path],
            |row| row.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if exists {
        conn.execute("DELETE FROM favorites WHERE path = ?1", [&path])
            .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO favorites (path) VALUES (?1)",
            [&path],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
