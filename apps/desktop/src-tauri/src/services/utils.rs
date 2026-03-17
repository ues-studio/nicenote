use std::ffi::OsStr;
use std::fs;
use std::path::{Component, Path};

use anyhow::{bail, Result};
use chrono::Utc;

/// 校验文件路径安全性：拒绝路径遍历（`..` 组件）和非 .md 文件
pub fn validate_note_path(path: &str) -> Result<()> {
    let p = Path::new(path);
    // 拒绝包含 ".." 的路径（防止路径遍历）
    for component in p.components() {
        if component == Component::ParentDir {
            bail!("路径不合法：不允许包含 \"..\"");
        }
    }
    // 笔记操作只允许 .md 文件
    if !is_markdown_file(p) {
        bail!("路径不合法：仅支持 .md 文件");
    }
    Ok(())
}

/// 校验目录路径安全性：拒绝路径遍历（`..` 组件）
pub fn validate_folder_path(path: &str) -> Result<()> {
    let p = Path::new(path);
    for component in p.components() {
        if component == Component::ParentDir {
            bail!("路径不合法：不允许包含 \"..\"");
        }
    }
    Ok(())
}

/// 从文件的修改时间生成 ISO 8601 格式字符串
/// 如果无法获取修改时间，返回当前时间
pub fn format_modified_time(path: &Path) -> String {
    fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .and_then(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
        .map(|dt| dt.format("%Y-%m-%dT%H:%M:%SZ").to_string())
        .unwrap_or_else(|| Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string())
}

/// 判断 walkdir 条目是否为隐藏文件/目录（以 `.` 开头，但跳过根目录自身）
pub fn is_hidden_entry(file_name: &OsStr, entry_path: &Path, root_path: &Path) -> bool {
    file_name
        .to_str()
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
        && entry_path != root_path
}

/// 判断路径是否为 Markdown 文件
pub fn is_markdown_file(path: &Path) -> bool {
    path.extension().and_then(|e| e.to_str()) == Some("md")
}
