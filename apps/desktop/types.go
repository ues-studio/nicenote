package main

// NoteFile 表示一个 .md 文件笔记
type NoteFile struct {
	Path      string   `json:"path"`      // 绝对文件路径
	Title     string   `json:"title"`     // 文件名不含 .md 后缀
	Summary   string   `json:"summary"`   // 前 100 字内容摘要
	Tags      []string `json:"tags"`      // frontmatter tags
	CreatedAt string   `json:"createdAt"` // ISO8601 from frontmatter or file ctime
	UpdatedAt string   `json:"updatedAt"` // ISO8601 file mtime
}

// NoteContent 包含完整内容（仅在打开时加载）
type NoteContent struct {
	NoteFile
	Content    string `json:"content"`    // 完整 markdown 内容（不含 frontmatter）
	RawContent string `json:"rawContent"` // 完整原始文件内容（含 frontmatter）
}

// FolderNode 表示文件系统目录树节点
type FolderNode struct {
	Path      string       `json:"path"`
	Name      string       `json:"name"`
	Children  []FolderNode `json:"children"`
	NoteCount int          `json:"noteCount"`
}

// SearchResult 搜索结果
type SearchResult struct {
	Path      string   `json:"path"`
	Title     string   `json:"title"`
	Snippet   string   `json:"snippet"` // 匹配片段（含高亮标记）
	Tags      []string `json:"tags"`
	UpdatedAt string   `json:"updatedAt"`
}

// Settings 用户设置
type Settings struct {
	Theme    string `json:"theme"`    // "system" | "light" | "dark"
	Language string `json:"language"` // "zh" | "en"
}

// TagColor 标签颜色
type TagColor struct {
	Tag   string `json:"tag"`
	Color string `json:"color"`
}
