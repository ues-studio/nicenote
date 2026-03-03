package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

// SearchService 提供全文搜索功能
type SearchService struct{}

// SearchResult 搜索结果（与 main 包的 SearchResult 对应）
type SearchResultInfo struct {
	Path      string
	Title     string
	Snippet   string // 匹配片段，高亮标记为 <mark>...</mark>
	Tags      []string
	UpdatedAt string
}

// SearchNotes 在 folderPath 下递归搜索包含 query 的笔记（大小写不敏感）
// 同时搜索标题和正文内容
func (s *SearchService) SearchNotes(folderPath string, query string) ([]SearchResultInfo, error) {
	if query == "" {
		return []SearchResultInfo{}, nil
	}

	queryLower := strings.ToLower(query)
	var results []SearchResultInfo

	err := filepath.WalkDir(folderPath, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil // 跳过无法访问的条目
		}
		if d.IsDir() {
			// 跳过隐藏目录
			if strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.ToLower(filepath.Ext(path)) != ".md" {
			return nil
		}

		info, statErr := d.Info()
		if statErr != nil {
			return nil
		}

		raw, readErr := os.ReadFile(path)
		if readErr != nil {
			return nil
		}

		content := string(raw)
		tags, _, body := ParseFrontmatter(content)
		title := strings.TrimSuffix(filepath.Base(path), ".md")

		titleLower := strings.ToLower(title)
		bodyLower := strings.ToLower(body)

		// 检查标题或正文是否匹配
		titleMatch := strings.Contains(titleLower, queryLower)
		bodyIdx := strings.Index(bodyLower, queryLower)
		if !titleMatch && bodyIdx == -1 {
			return nil
		}

		// 提取匹配片段
		var snippet string
		if bodyIdx != -1 {
			snippet = extractSnippet(body, bodyIdx, len(query), 50)
		} else {
			// 仅标题匹配，截取正文前 100 个字符作为预览
			snippet = buildSummary(body, 100)
		}

		results = append(results, SearchResultInfo{
			Path:      path,
			Title:     title,
			Snippet:   snippet,
			Tags:      tags,
			UpdatedAt: info.ModTime().Format("2006-01-02T15:04:05Z07:00"),
		})
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("搜索目录 %s 失败: %w", folderPath, err)
	}

	if results == nil {
		results = []SearchResultInfo{}
	}
	return results, nil
}

// extractSnippet 从 text 中提取匹配位置前后各 contextRunes 个字符的片段
// matchByteIdx 为匹配起始字节位置，matchLen 为查询字符串字节长度
// 返回带 <mark> 标记的 HTML 片段
func extractSnippet(text string, matchByteIdx int, matchLen int, contextRunes int) string {
	runes := []rune(text)

	// 将字节偏移转换为 rune 偏移
	matchRuneStart := utf8.RuneCountInString(text[:matchByteIdx])
	matchRuneEnd := matchRuneStart + utf8.RuneCountInString(text[matchByteIdx : matchByteIdx+matchLen])

	// 计算上下文范围
	start := matchRuneStart - contextRunes
	if start < 0 {
		start = 0
	}
	end := matchRuneEnd + contextRunes
	if end > len(runes) {
		end = len(runes)
	}

	prefix := ""
	suffix := ""
	if start > 0 {
		prefix = "..."
	}
	if end < len(runes) {
		suffix = "..."
	}

	before := string(runes[start:matchRuneStart])
	matched := string(runes[matchRuneStart:matchRuneEnd])
	after := string(runes[matchRuneEnd:end])

	return fmt.Sprintf("%s%s<mark>%s</mark>%s%s", prefix, before, matched, after, suffix)
}
