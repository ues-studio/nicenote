package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite" // 注册 SQLite 驱动（纯 Go，无 CGO）
)

// Open 初始化并返回 SQLite 数据库连接
// 数据库文件存放在系统用户配置目录下的 NiceNote/cache.db
func Open() (*sql.DB, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("获取用户配置目录失败: %w", err)
	}

	dbDir := filepath.Join(dir, "NiceNote")
	if err := os.MkdirAll(dbDir, 0o755); err != nil {
		return nil, fmt.Errorf("创建数据库目录 %s 失败: %w", dbDir, err)
	}

	dbPath := filepath.Join(dbDir, "cache.db")
	database, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("打开 SQLite 数据库失败: %w", err)
	}

	// 配置 WAL 模式以提升并发读写性能
	database.Exec("PRAGMA journal_mode=WAL;")    //nolint:errcheck
	database.Exec("PRAGMA synchronous=NORMAL;")  //nolint:errcheck
	database.Exec("PRAGMA foreign_keys=ON;")     //nolint:errcheck
	database.Exec("PRAGMA cache_size=-8192;")    //nolint:errcheck

	// 限制连接数，SQLite WAL 模式下单写连接即可
	database.SetMaxOpenConns(1)

	if err := migrate(database); err != nil {
		database.Close()
		return nil, fmt.Errorf("数据库迁移失败: %w", err)
	}

	return database, nil
}

// migrate 执行数据库表初始化（幂等，不存在则创建）
func migrate(database *sql.DB) error {
	_, err := database.Exec(`
		CREATE TABLE IF NOT EXISTS recent_folders (
			path      TEXT PRIMARY KEY,
			opened_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS favorites (
			path TEXT PRIMARY KEY
		);

		CREATE TABLE IF NOT EXISTS settings (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS tag_colors (
			tag   TEXT PRIMARY KEY,
			color TEXT NOT NULL
		);
	`)
	if err != nil {
		return fmt.Errorf("建表失败: %w", err)
	}
	return nil
}
