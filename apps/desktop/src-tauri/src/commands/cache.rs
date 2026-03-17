use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

impl Theme {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Light => "light",
            Self::Dark => "dark",
            Self::System => "system",
        }
    }

    fn from_str(s: &str) -> Self {
        match s {
            "light" => Self::Light,
            "dark" => Self::Dark,
            _ => Self::System,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    En,
    Zh,
}

impl Language {
    fn as_str(&self) -> &'static str {
        match self {
            Self::En => "en",
            Self::Zh => "zh",
        }
    }

    fn from_str(s: &str) -> Self {
        match s {
            "en" => Self::En,
            _ => Self::Zh,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub theme: Theme,
    pub language: Language,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: Theme::System,
            language: Language::Zh,
        }
    }
}

/// 通用查询辅助：执行返回单列字符串列表的 SQL
fn query_string_list(conn: &rusqlite::Connection, sql: &str) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.map(|r| r.map_err(|e| e.to_string())).collect()
}

// ---- 最近文件夹 ----

#[tauri::command]
pub fn get_recent_folders(state: State<AppState>) -> Result<Vec<String>, String> {
    let conn = state.db.lock();
    query_string_list(&conn, "SELECT path FROM recent_folders ORDER BY accessed_at DESC LIMIT 20")
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
    let theme = get_setting(&conn, "theme")
        .map(|s| Theme::from_str(&s))
        .unwrap_or(Theme::System);
    let language = get_setting(&conn, "language")
        .map(|s| Language::from_str(&s))
        .unwrap_or(Language::Zh);
    Ok(Settings { theme, language })
}

#[tauri::command]
pub fn save_settings(state: State<AppState>, settings: Settings) -> Result<(), String> {
    let conn = state.db.lock();
    set_setting(&conn, "theme", settings.theme.as_str()).map_err(|e| e.to_string())?;
    set_setting(&conn, "language", settings.language.as_str()).map_err(|e| e.to_string())?;
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

/// 合法的 hex 颜色格式：#RRGGBB（与前端 TAG_COLOR_REGEX 保持一致）
fn is_valid_hex_color(s: &str) -> bool {
    s.len() == 7
        && s.starts_with('#')
        && s[1..].bytes().all(|b| b.is_ascii_hexdigit())
}

#[tauri::command]
pub fn set_tag_color(state: State<AppState>, tag: String, color: String) -> Result<(), String> {
    if !is_valid_hex_color(&color) {
        return Err("颜色格式不合法，需要 #RRGGBB 格式".to_string());
    }
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
    query_string_list(&conn, "SELECT path FROM favorites ORDER BY created_at DESC")
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
        .map_err(|e| e.to_string())?;

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
