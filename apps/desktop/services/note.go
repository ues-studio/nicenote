package services

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

// NoteService 提供基于文件系统的笔记操作（以 .md 文件为数据源）
type NoteService struct{}

// noteFromPath 根据文件路径构建 NoteFile 元信息
func noteFromPath(path string) (*NoteFileInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat %s: %w", path, err)
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}

	content := string(raw)
	tags, created, body := ParseFrontmatter(content)

	// 文件名作为标题（去除 .md 后缀）
	title := strings.TrimSuffix(filepath.Base(path), ".md")

	// createdAt 优先使用 frontmatter 中的 created 字段
	createdAt := created
	if createdAt == "" {
		// 回退到文件修改时间（Windows 不提供 birthtime，用 mtime 近似）
		createdAt = info.ModTime().Format(time.RFC3339)
	}

	updatedAt := info.ModTime().Format(time.RFC3339)
	summary := buildSummary(body, 100)

	return &NoteFileInfo{
		Path:      path,
		Title:     title,
		Summary:   summary,
		Tags:      tags,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}, nil
}

// NoteFileInfo 内部使用的笔记元信息（字段与 main 包的 NoteFile 对应）
type NoteFileInfo struct {
	Path      string
	Title     string
	Summary   string
	Tags      []string
	CreatedAt string
	UpdatedAt string
}

// markdownStripRe 用于去除常见 Markdown 语法符号，以提取纯文本摘要
var markdownStripRe = regexp.MustCompile(`(?m)^#{1,6}\s+|[*_~` + "`" + `]|\[([^\]]*)\]\([^)]*\)|\!\[[^\]]*\]\([^)]*\)`)

// buildSummary 剥离 Markdown 语法后取前 maxRunes 个字符作为摘要
func buildSummary(body string, maxRunes int) string {
	// 去除 Markdown 标记
	plain := markdownStripRe.ReplaceAllString(body, "$1")
	// 压缩多余空白和换行
	plain = strings.Join(strings.Fields(plain), " ")
	plain = strings.TrimSpace(plain)

	if utf8.RuneCountInString(plain) <= maxRunes {
		return plain
	}
	// 截取前 maxRunes 个 rune
	runes := []rune(plain)
	return string(runes[:maxRunes])
}

// ListNotes 递归扫描 folderPath 下所有 .md 文件，返回元信息列表
func (s *NoteService) ListNotes(folderPath string) ([]NoteFileInfo, error) {
	var notes []NoteFileInfo

	err := filepath.WalkDir(folderPath, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil // 跳过无法访问的条目
		}
		if d.IsDir() {
			// 跳过隐藏目录（以 . 开头）
			if strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.ToLower(filepath.Ext(path)) != ".md" {
			return nil
		}

		note, err := noteFromPath(path)
		if err != nil {
			return nil // 跳过解析失败的文件
		}
		notes = append(notes, *note)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("扫描目录 %s 失败: %w", folderPath, err)
	}

	if notes == nil {
		notes = []NoteFileInfo{}
	}
	return notes, nil
}

// GetNoteContent 读取指定路径笔记的完整内容
func (s *NoteService) GetNoteContent(path string) (*NoteContentInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat %s: %w", path, err)
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取文件 %s 失败: %w", path, err)
	}

	rawContent := string(raw)
	tags, created, body := ParseFrontmatter(rawContent)

	title := strings.TrimSuffix(filepath.Base(path), ".md")
	createdAt := created
	if createdAt == "" {
		createdAt = info.ModTime().Format(time.RFC3339)
	}
	updatedAt := info.ModTime().Format(time.RFC3339)
	summary := buildSummary(body, 100)

	return &NoteContentInfo{
		NoteFileInfo: NoteFileInfo{
			Path:      path,
			Title:     title,
			Summary:   summary,
			Tags:      tags,
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		},
		Content:    body,
		RawContent: rawContent,
	}, nil
}

// NoteContentInfo 内部使用的完整笔记信息
type NoteContentInfo struct {
	NoteFileInfo
	Content    string
	RawContent string
}

// SaveNote 保存笔记内容到 .md 文件（使用临时文件原子替换）
// content 为不含 frontmatter 的正文，tags 为标签列表
func (s *NoteService) SaveNote(path string, content string, tags []string) error {
	// 读取现有 frontmatter 以保留 created 时间
	existingCreated := ""
	if raw, err := os.ReadFile(path); err == nil {
		_, existingCreated, _ = ParseFrontmatter(string(raw))
	}
	if existingCreated == "" {
		existingCreated = time.Now().Format(time.RFC3339)
	}

	fullContent := WriteFrontmatter(tags, existingCreated, content)
	return atomicWrite(path, []byte(fullContent))
}

// CreateNote 在 folderPath 下创建新笔记，默认文件名为 "YYYY-MM-DD HH:mm.md"
func (s *NoteService) CreateNote(folderPath string) (*NoteFileInfo, error) {
	now := time.Now()
	// 文件名使用本地时间，格式安全（避免冒号在某些 OS 上不合法，Windows 不允许冒号）
	fileName := now.Format("2006-01-02 15-04") + ".md"
	path := filepath.Join(folderPath, fileName)

	// 若同名文件已存在，追加序号
	if _, err := os.Stat(path); err == nil {
		for i := 2; i < 1000; i++ {
			candidate := filepath.Join(folderPath, fmt.Sprintf("%s (%d).md", now.Format("2006-01-02 15-04"), i))
			if _, err := os.Stat(candidate); os.IsNotExist(err) {
				path = candidate
				break
			}
		}
	}

	created := now.Format(time.RFC3339)
	fullContent := WriteFrontmatter([]string{}, created, "")

	if err := os.MkdirAll(folderPath, 0o755); err != nil {
		return nil, fmt.Errorf("创建目录 %s 失败: %w", folderPath, err)
	}
	if err := os.WriteFile(path, []byte(fullContent), 0o644); err != nil {
		return nil, fmt.Errorf("创建笔记文件失败: %w", err)
	}

	title := strings.TrimSuffix(filepath.Base(path), ".md")
	return &NoteFileInfo{
		Path:      path,
		Title:     title,
		Summary:   "",
		Tags:      []string{},
		CreatedAt: created,
		UpdatedAt: created,
	}, nil
}

// RenameNote 重命名笔记（即重命名 .md 文件）
// newTitle 不含 .md 后缀
func (s *NoteService) RenameNote(oldPath string, newTitle string) (*NoteFileInfo, error) {
	// 清理标题中的非法字符（Windows 路径限制）
	newTitle = sanitizeTitle(newTitle)
	if newTitle == "" {
		return nil, fmt.Errorf("标题不能为空")
	}

	dir := filepath.Dir(oldPath)
	newPath := filepath.Join(dir, newTitle+".md")

	if oldPath == newPath {
		return noteFromPath(oldPath)
	}

	// 检查目标是否已存在
	if _, err := os.Stat(newPath); err == nil {
		return nil, fmt.Errorf("同名文件已存在: %s", newPath)
	}

	if err := os.Rename(oldPath, newPath); err != nil {
		return nil, fmt.Errorf("重命名失败: %w", err)
	}

	return noteFromPath(newPath)
}

// DeleteNote 将笔记移动到同目录下的 .trash 子目录（模拟回收站）
func (s *NoteService) DeleteNote(path string) error {
	dir := filepath.Dir(path)
	trashDir := filepath.Join(dir, ".trash")

	if err := os.MkdirAll(trashDir, 0o755); err != nil {
		return fmt.Errorf("创建 .trash 目录失败: %w", err)
	}

	base := filepath.Base(path)
	dest := filepath.Join(trashDir, base)

	// 如果 .trash 中已有同名文件，追加时间戳
	if _, err := os.Stat(dest); err == nil {
		ext := filepath.Ext(base)
		stem := strings.TrimSuffix(base, ext)
		dest = filepath.Join(trashDir, fmt.Sprintf("%s_%d%s", stem, time.Now().UnixMilli(), ext))
	}

	if err := os.Rename(path, dest); err != nil {
		return fmt.Errorf("移动到回收站失败: %w", err)
	}
	return nil
}

// atomicWrite 使用临时文件 + rename 原子写入文件
func atomicWrite(path string, data []byte) error {
	dir := filepath.Dir(path)
	tmpFile, err := os.CreateTemp(dir, ".nicenote-tmp-*")
	if err != nil {
		return fmt.Errorf("创建临时文件失败: %w", err)
	}
	tmpPath := tmpFile.Name()

	// 确保临时文件在出错时被清理
	defer func() {
		os.Remove(tmpPath) // 若 rename 成功则文件已不存在，Remove 会静默失败
	}()

	if _, err := tmpFile.Write(data); err != nil {
		tmpFile.Close()
		return fmt.Errorf("写入临时文件失败: %w", err)
	}
	if err := tmpFile.Sync(); err != nil {
		tmpFile.Close()
		return fmt.Errorf("同步临时文件失败: %w", err)
	}
	if err := tmpFile.Close(); err != nil {
		return fmt.Errorf("关闭临时文件失败: %w", err)
	}

	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("原子替换文件失败: %w", err)
	}
	return nil
}

// illegalCharsRe 匹配 Windows/macOS 文件名中的非法字符
var illegalCharsRe = regexp.MustCompile(`[\\/:*?"<>|]`)

// sanitizeTitle 清理文件名中的非法字符
func sanitizeTitle(title string) string {
	title = illegalCharsRe.ReplaceAllString(title, "")
	title = strings.TrimSpace(title)
	return title
}
