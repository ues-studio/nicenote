use std::path::Path;
use std::time::Duration;

use notify_debouncer_mini::{new_debouncer, notify::RecursiveMode, DebounceEventResult};
use tauri::{AppHandle, Emitter, State};

use crate::AppState;

/// 启动对 folder_path 的文件系统监听，通过 Tauri 事件通知前端
/// 事件名：file:created / file:modified / file:deleted（依据文件是否仍存在判断）
#[tauri::command]
pub fn watch_folder(
    app: AppHandle,
    folder_path: String,
    state: State<AppState>,
) -> Result<(), String> {
    let path = folder_path.clone();
    let app_clone = app.clone();

    let debouncer = new_debouncer(
        Duration::from_millis(300),
        move |result: DebounceEventResult| {
            if let Ok(events) = result {
                for event in events {
                    let file_path = event.path.to_string_lossy().to_string();
                    // 只处理 .md 文件
                    if event.path.extension().and_then(|e| e.to_str()) != Some("md") {
                        continue;
                    }
                    // 跳过隐藏路径（.git, .trash 等）
                    if event
                        .path
                        .components()
                        .any(|c| c.as_os_str().to_str().map(|s| s.starts_with('.')).unwrap_or(false))
                    {
                        continue;
                    }
                    let payload = serde_json::json!({ "path": file_path });
                    // notify-debouncer-mini 不区分 Create/Write/Remove，
                    // 通过文件是否存在来判断事件类型
                    if event.path.exists() {
                        let _ = app_clone.emit("file:modified", &payload);
                    } else {
                        let _ = app_clone.emit("file:deleted", &payload);
                    }
                }
            }
        },
    )
    .map_err(|e| e.to_string())?;

    // 将 debouncer 存入 state，替换旧的（旧的 drop 时自动停止监听）
    let mut watcher = state.watcher.lock();
    let mut d = debouncer;
    d.watcher()
        .watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;
    *watcher = Some(d);

    Ok(())
}
