use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

use super::frontmatter::{self, Frontmatter};

// ============================================================
// 对外暴露的数据类型（与前端 TS 接口一一对应）
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NoteFile {
    pub path: String,
    pub title: String,
    pub summary: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteContent {
    #[serde(flatten)]
    pub meta: NoteFile,
    pub content: String,
    pub raw_content: String,
}

// ============================================================
// 笔记列表
// ============================================================

/// 递归列出 folder_path 下所有 .md 文件的元信息
pub fn list_notes(folder_path: &str) -> Result<Vec<NoteFile>> {
    let mut notes = Vec::new();
    for entry in WalkDir::new(folder_path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        // 跳过隐藏目录（.git, .trash 等）
        if entry
            .file_name()
            .to_str()
            .map(|s| s.starts_with('.'))
            .unwrap_or(false)
            && path != Path::new(folder_path)
        {
            continue;
        }
        if path.extension().and_then(|e| e.to_str()) == Some("md") {
            if let Ok(meta) = read_meta(path) {
                notes.push(meta);
            }
        }
    }
    Ok(notes)
}

// ============================================================
// 读取单个笔记
// ============================================================

/// 读取笔记元信息（不含正文）
fn read_meta(path: &Path) -> Result<NoteFile> {
    let raw = fs::read_to_string(path)?;
    let (fm, body) = frontmatter::parse(&raw);
    build_note_file(path, &fm, &body)
}

/// 读取笔记完整内容（含正文和 frontmatter）
pub fn get_note_content(path: &str) -> Result<NoteContent> {
    let p = Path::new(path);
    let raw = fs::read_to_string(p).context("读取笔记文件失败")?;
    let (fm, body) = frontmatter::parse(&raw);
    let meta = build_note_file(p, &fm, &body)?;
    Ok(NoteContent {
        meta,
        content: body,
        raw_content: raw,
    })
}

fn build_note_file(path: &Path, fm: &Frontmatter, body: &str) -> Result<NoteFile> {
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");
    let title = fm
        .title
        .clone()
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| frontmatter::title_from_filename(stem));

    // 摘要：取正文前 120 字符（去掉 Markdown 标记符）
    let summary_raw = body
        .lines()
        .find(|l| !l.trim().is_empty() && !l.trim_start().starts_with('#'))
        .unwrap_or("")
        .trim()
        .trim_start_matches(|c: char| !c.is_alphanumeric() && !c.is_whitespace());
    let summary: String = summary_raw.chars().take(120).collect();

    let metadata = fs::metadata(path)?;
    let updated_at = metadata
        .modified()
        .ok()
        .and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0))
        })
        .flatten()
        .map(|dt| dt.format("%Y-%m-%dT%H:%M:%SZ").to_string())
        .unwrap_or_else(|| Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string());

    let created_at = fm.created_at.clone().unwrap_or_else(|| updated_at.clone());

    Ok(NoteFile {
        path: path.to_string_lossy().to_string(),
        title,
        summary,
        tags: fm.tags.clone(),
        created_at,
        updated_at,
    })
}

// ============================================================
// 保存笔记（原子写入）
// ============================================================

/// 保存笔记正文和标签（保留原有 frontmatter 中的 title/created_at）
pub fn save_note(path: &str, content: &str, tags: &[String]) -> Result<()> {
    let p = Path::new(path);
    let raw = fs::read_to_string(p).unwrap_or_default();
    let (mut fm, _) = frontmatter::parse(&raw);
    fm.tags = tags.to_vec();

    let new_raw = frontmatter::write(&fm, content);
    atomic_write(p, &new_raw)
}

// ============================================================
// 创建笔记
// ============================================================

pub fn create_note(folder_path: &str) -> Result<NoteFile> {
    let folder = Path::new(folder_path);
    fs::create_dir_all(folder)?;

    // 生成唯一文件名：Untitled, Untitled 2, Untitled 3 ...
    let path = find_unique_path(folder, "Untitled", "md");

    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");
    let fm = Frontmatter {
        title: Some(stem.to_string()),
        tags: vec![],
        created_at: Some(now),
    };
    let raw = frontmatter::write(&fm, "");
    atomic_write(&path, &raw)?;
    read_meta(&path)
}

// ============================================================
// 重命名笔记
// ============================================================

pub fn rename_note(old_path: &str, new_title: &str) -> Result<NoteFile> {
    let old = Path::new(old_path);
    let parent = old.parent().context("无法获取父目录")?;

    // 清理标题为合法文件名（替换 / \ : * ? " < > |）
    let safe_name = sanitize_filename(new_title);
    let new_path = find_unique_path(parent, &safe_name, "md");

    // 先更新 frontmatter 中的 title
    let raw = fs::read_to_string(old).unwrap_or_default();
    let (mut fm, body) = frontmatter::parse(&raw);
    fm.title = Some(new_title.to_string());
    let new_raw = frontmatter::write(&fm, &body);

    // 写入新文件路径，删除旧文件
    atomic_write(&new_path, &new_raw)?;
    if old != new_path {
        fs::remove_file(old).ok();
    }

    read_meta(&new_path)
}

// ============================================================
// 删除笔记（移入 .trash）
// ============================================================

pub fn delete_note(path: &str) -> Result<()> {
    let p = Path::new(path);
    let parent = p.parent().context("无法获取父目录")?;
    let trash_dir = parent.join(".trash");
    fs::create_dir_all(&trash_dir)?;

    let file_name = p
        .file_name()
        .context("无法获取文件名")?
        .to_string_lossy()
        .to_string();
    let dest = find_unique_path(&trash_dir, &file_name.trim_end_matches(".md"), "md");
    fs::rename(p, dest)?;
    Ok(())
}

// ============================================================
// 工具函数
// ============================================================

/// 原子写入：先写临时文件，再 rename，保证不丢数据
fn atomic_write(path: &Path, content: &str) -> Result<()> {
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, content)?;
    fs::rename(&tmp, path)?;
    Ok(())
}

/// 在 dir 中寻找不冲突的文件名：name.ext → name 2.ext → name 3.ext
fn find_unique_path(dir: &Path, name: &str, ext: &str) -> PathBuf {
    let candidate = dir.join(format!("{}.{}", name, ext));
    if !candidate.exists() {
        return candidate;
    }
    let mut i = 2;
    loop {
        let candidate = dir.join(format!("{} {}.{}", name, i, ext));
        if !candidate.exists() {
            return candidate;
        }
        i += 1;
    }
}

/// 替换文件名中的非法字符
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

// ============================================================
// 目录树
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderNode {
    pub path: String,
    pub name: String,
    pub note_count: usize,
    pub children: Vec<FolderNode>,
}

/// 递归构建目录树（只保留含 .md 文件的目录）
pub fn get_folder_tree(root: &str) -> Result<FolderNode> {
    build_tree(Path::new(root))
}

fn build_tree(dir: &Path) -> Result<FolderNode> {
    let name = dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let mut note_count = 0;
    let mut children = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        let mut dirs: Vec<PathBuf> = Vec::new();
        for entry in entries.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            // 跳过隐藏目录
            if fname.starts_with('.') {
                continue;
            }
            if path.is_dir() {
                dirs.push(path);
            } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
                note_count += 1;
            }
        }
        dirs.sort();
        for d in dirs {
            if let Ok(child) = build_tree(&d) {
                if child.note_count > 0 || !child.children.is_empty() {
                    note_count += child.note_count;
                    children.push(child);
                }
            }
        }
    }

    Ok(FolderNode {
        path: dir.to_string_lossy().to_string(),
        name,
        note_count,
        children,
    })
}
