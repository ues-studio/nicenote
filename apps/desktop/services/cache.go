package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

// CacheService 提供基于 SQLite 的缓存操作（最近目录、收藏夹、设置、标签颜色）
type CacheService struct {
	db *sql.DB
}

// NewCacheService 创建 CacheService 实例
func NewCacheService(db *sql.DB) *CacheService {
	return &CacheService{db: db}
}

// SettingsInfo 内部使用的设置（与 main 包的 Settings 对应）
type SettingsInfo struct {
	Theme    string
	Language string
}

// --- 最近打开的目录 ---

// GetRecentFolders 获取最近打开的目录列表（按打开时间降序，最多 20 条）
func (s *CacheService) GetRecentFolders() ([]string, error) {
	rows, err := s.db.Query(`
		SELECT path FROM recent_folders
		ORDER BY opened_at DESC
		LIMIT 20
	`)
	if err != nil {
		return nil, fmt.Errorf("查询最近目录失败: %w", err)
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var path string
		if err := rows.Scan(&path); err != nil {
			return nil, err
		}
		paths = append(paths, path)
	}
	if paths == nil {
		paths = []string{}
	}
	return paths, rows.Err()
}

// AddRecentFolder 添加或更新最近打开的目录（upsert 更新 opened_at）
func (s *CacheService) AddRecentFolder(path string) error {
	_, err := s.db.Exec(`
		INSERT INTO recent_folders (path, opened_at)
		VALUES (?, datetime('now'))
		ON CONFLICT(path) DO UPDATE SET opened_at = datetime('now')
	`, path)
	if err != nil {
		return fmt.Errorf("添加最近目录失败: %w", err)
	}

	// 保留最近 50 条记录，删除旧的
	_, err = s.db.Exec(`
		DELETE FROM recent_folders
		WHERE path NOT IN (
			SELECT path FROM recent_folders
			ORDER BY opened_at DESC
			LIMIT 50
		)
	`)
	return err
}

// --- 收藏夹 ---

// GetFavorites 获取所有已收藏的路径列表
func (s *CacheService) GetFavorites() ([]string, error) {
	rows, err := s.db.Query(`SELECT path FROM favorites ORDER BY path`)
	if err != nil {
		return nil, fmt.Errorf("查询收藏夹失败: %w", err)
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var path string
		if err := rows.Scan(&path); err != nil {
			return nil, err
		}
		paths = append(paths, path)
	}
	if paths == nil {
		paths = []string{}
	}
	return paths, rows.Err()
}

// ToggleFavorite 切换路径的收藏状态：已收藏则取消，未收藏则添加
func (s *CacheService) ToggleFavorite(path string) error {
	// 先检查是否已收藏
	var count int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM favorites WHERE path = ?`, path).Scan(&count); err != nil {
		return fmt.Errorf("查询收藏状态失败: %w", err)
	}

	if count > 0 {
		_, err := s.db.Exec(`DELETE FROM favorites WHERE path = ?`, path)
		if err != nil {
			return fmt.Errorf("取消收藏失败: %w", err)
		}
	} else {
		_, err := s.db.Exec(`INSERT INTO favorites (path) VALUES (?)`, path)
		if err != nil {
			return fmt.Errorf("添加收藏失败: %w", err)
		}
	}
	return nil
}

// --- 设置 ---

// GetSettings 读取用户设置，若不存在则返回默认值
func (s *CacheService) GetSettings() (*SettingsInfo, error) {
	settings := &SettingsInfo{
		Theme:    "system",
		Language: "zh",
	}

	rows, err := s.db.Query(`SELECT key, value FROM settings`)
	if err != nil {
		return nil, fmt.Errorf("查询设置失败: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		switch key {
		case "theme":
			settings.Theme = value
		case "language":
			settings.Language = value
		}
	}
	return settings, rows.Err()
}

// SaveSettings 保存用户设置（逐字段 upsert）
func (s *CacheService) SaveSettings(settings *SettingsInfo) error {
	kvPairs := map[string]string{
		"theme":    settings.Theme,
		"language": settings.Language,
	}

	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("开启事务失败: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	for k, v := range kvPairs {
		_, err := tx.Exec(`
			INSERT INTO settings (key, value)
			VALUES (?, ?)
			ON CONFLICT(key) DO UPDATE SET value = excluded.value
		`, k, v)
		if err != nil {
			return fmt.Errorf("保存设置 %s 失败: %w", k, err)
		}
	}

	return tx.Commit()
}

// --- 标签颜色 ---

// GetTagColors 获取所有标签颜色映射（tag -> color）
func (s *CacheService) GetTagColors() (map[string]string, error) {
	rows, err := s.db.Query(`SELECT tag, color FROM tag_colors`)
	if err != nil {
		return nil, fmt.Errorf("查询标签颜色失败: %w", err)
	}
	defer rows.Close()

	colors := make(map[string]string)
	for rows.Next() {
		var tag, color string
		if err := rows.Scan(&tag, &color); err != nil {
			return nil, err
		}
		colors[tag] = color
	}
	return colors, rows.Err()
}

// SetTagColor 设置指定标签的颜色（upsert）
func (s *CacheService) SetTagColor(tag, color string) error {
	_, err := s.db.Exec(`
		INSERT INTO tag_colors (tag, color)
		VALUES (?, ?)
		ON CONFLICT(tag) DO UPDATE SET color = excluded.color
	`, tag, color)
	if err != nil {
		return fmt.Errorf("设置标签颜色失败: %w", err)
	}
	return nil
}

// jsonValue 辅助函数：将任意值序列化为 JSON 字符串（用于扩展存储）
func jsonValue(v any) (string, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
