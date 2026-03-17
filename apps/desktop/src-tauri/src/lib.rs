mod commands;
mod db;
mod services;

use std::path::PathBuf;

use notify::RecommendedWatcher;
use parking_lot::{Mutex, RwLock};
use rusqlite::Connection;
use tauri::Manager;

use services::search_index::SearchIndex;

// ============================================================
// 应用全局状态
// ============================================================

pub struct AppState {
    pub db: Mutex<Connection>,
    pub watcher: Mutex<Option<RecommendedWatcher>>,
    /// 搜索索引使用 RwLock：搜索（读操作）可并发，仅索引更新（写操作）互斥
    pub search_index: RwLock<SearchIndex>,
}

// ============================================================
// 应用入口
// ============================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 确定数据库路径：{app_data_dir}/cache.db
            let db_path = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .join("cache.db");

            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent).ok();
            }

            let db_path_str = db_path.to_str().ok_or("缓存路径包含非 UTF-8 字符")?;
            let conn = db::open(db_path_str)?;

            app.manage(AppState {
                db: Mutex::new(conn),
                watcher: Mutex::new(None),
                search_index: RwLock::new(SearchIndex::default()),
            });

            // 开发模式下自动打开 DevTools
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 目录管理
            commands::folder::open_folder_dialog,
            commands::folder::reveal_in_explorer,
            // 笔记操作
            commands::note::list_notes,
            commands::note::get_note_content,
            commands::note::save_note,
            commands::note::create_note,
            commands::note::rename_note,
            commands::note::delete_note,
            commands::note::get_folder_tree,
            // 搜索
            commands::search::search_notes,
            // 文件监听
            commands::watcher::watch_folder,
            // 缓存 / 设置
            commands::cache::get_recent_folders,
            commands::cache::add_recent_folder,
            commands::cache::get_settings,
            commands::cache::save_settings,
            commands::cache::get_tag_colors,
            commands::cache::set_tag_color,
            commands::cache::get_favorites,
            commands::cache::toggle_favorite,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用失败");
}
