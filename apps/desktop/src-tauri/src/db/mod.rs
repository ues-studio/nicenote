use anyhow::Result;
use rusqlite::Connection;

/// 初始化 SQLite 缓存数据库，执行建表 migration，返回连接
pub fn open(db_path: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // 性能优化 pragma
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=NORMAL;
         PRAGMA foreign_keys=ON;",
    )?;

    // 建表（idempotent）
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS recent_folders (
            path        TEXT PRIMARY KEY,
            accessed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tag_colors (
            tag   TEXT PRIMARY KEY,
            color TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS favorites (
            path       TEXT PRIMARY KEY,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )?;

    Ok(conn)
}
