package main

import (
	"nicenote-desktop/services"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// AppService 是 Wails3 的主服务，暴露所有前后端 IPC 方法
type AppService struct {
	noteService    *services.NoteService
	folderService  *services.FolderService
	searchService  *services.SearchService
	cacheService   *services.CacheService
	watcherService *services.WatcherService
}

// --- 目录管理 ---

// OpenFolderDialog 打开原生文件夹选择对话框，返回用户选择的目录路径
func (s *AppService) OpenFolderDialog() (string, error) {
	path, err := application.Get().Dialog.OpenFile().
		SetTitle("选择笔记文件夹").
		CanChooseDirectories(true).
		CanChooseFiles(false).
		CanCreateDirectories(true).
		PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return path, nil
}

// GetRecentFolders 获取最近打开的目录列表
func (s *AppService) GetRecentFolders() ([]string, error) {
	return s.cacheService.GetRecentFolders()
}

// AddRecentFolder 添加或更新最近打开的目录记录
func (s *AppService) AddRecentFolder(path string) error {
	return s.cacheService.AddRecentFolder(path)
}

// RevealInExplorer 在文件管理器中定位并显示指定路径
func (s *AppService) RevealInExplorer(path string) error {
	return application.Get().Env.OpenFileManager(path, true)
}

// --- 笔记操作 ---

// ListNotes 递归列出目录下所有 .md 文件的元信息
func (s *AppService) ListNotes(folderPath string) ([]NoteFile, error) {
	infos, err := s.noteService.ListNotes(folderPath)
	if err != nil {
		return nil, err
	}
	notes := make([]NoteFile, len(infos))
	for i, info := range infos {
		notes[i] = NoteFile{
			Path:      info.Path,
			Title:     info.Title,
			Summary:   info.Summary,
			Tags:      info.Tags,
			CreatedAt: info.CreatedAt,
			UpdatedAt: info.UpdatedAt,
		}
	}
	return notes, nil
}

// GetNoteContent 读取笔记的完整内容（含正文和 frontmatter）
func (s *AppService) GetNoteContent(path string) (*NoteContent, error) {
	info, err := s.noteService.GetNoteContent(path)
	if err != nil {
		return nil, err
	}
	return &NoteContent{
		NoteFile: NoteFile{
			Path:      info.Path,
			Title:     info.Title,
			Summary:   info.Summary,
			Tags:      info.Tags,
			CreatedAt: info.CreatedAt,
			UpdatedAt: info.UpdatedAt,
		},
		Content:    info.Content,
		RawContent: info.RawContent,
	}, nil
}

// SaveNote 保存笔记内容（原子写入，不含 frontmatter 的正文 + 标签列表）
func (s *AppService) SaveNote(path string, content string, tags []string) error {
	return s.noteService.SaveNote(path, content, tags)
}

// CreateNote 在指定目录下创建新笔记，返回新笔记元信息
func (s *AppService) CreateNote(folderPath string) (*NoteFile, error) {
	info, err := s.noteService.CreateNote(folderPath)
	if err != nil {
		return nil, err
	}
	return &NoteFile{
		Path:      info.Path,
		Title:     info.Title,
		Summary:   info.Summary,
		Tags:      info.Tags,
		CreatedAt: info.CreatedAt,
		UpdatedAt: info.UpdatedAt,
	}, nil
}

// RenameNote 重命名笔记（即重命名 .md 文件），返回更新后的元信息
func (s *AppService) RenameNote(oldPath string, newTitle string) (*NoteFile, error) {
	info, err := s.noteService.RenameNote(oldPath, newTitle)
	if err != nil {
		return nil, err
	}
	return &NoteFile{
		Path:      info.Path,
		Title:     info.Title,
		Summary:   info.Summary,
		Tags:      info.Tags,
		CreatedAt: info.CreatedAt,
		UpdatedAt: info.UpdatedAt,
	}, nil
}

// DeleteNote 删除笔记（移入 .trash 目录）
func (s *AppService) DeleteNote(path string) error {
	return s.noteService.DeleteNote(path)
}

// --- 搜索 ---

// SearchNotes 在目录内全文搜索笔记（搜索标题和正文，大小写不敏感）
func (s *AppService) SearchNotes(folderPath string, query string) ([]SearchResult, error) {
	infos, err := s.searchService.SearchNotes(folderPath, query)
	if err != nil {
		return nil, err
	}
	results := make([]SearchResult, len(infos))
	for i, info := range infos {
		results[i] = SearchResult{
			Path:      info.Path,
			Title:     info.Title,
			Snippet:   info.Snippet,
			Tags:      info.Tags,
			UpdatedAt: info.UpdatedAt,
		}
	}
	return results, nil
}

// --- 目录树 ---

// GetFolderTree 获取目录树结构（仅含有 .md 文件的目录）
func (s *AppService) GetFolderTree(rootPath string) (*FolderNode, error) {
	info, err := s.folderService.GetFolderTree(rootPath)
	if err != nil {
		return nil, err
	}
	return convertFolderNode(info), nil
}

// convertFolderNode 递归将 services.FolderNodeInfo 转换为 main 包的 FolderNode
func convertFolderNode(info *services.FolderNodeInfo) *FolderNode {
	if info == nil {
		return nil
	}
	node := &FolderNode{
		Path:      info.Path,
		Name:      info.Name,
		NoteCount: info.NoteCount,
		Children:  make([]FolderNode, len(info.Children)),
	}
	for i := range info.Children {
		child := convertFolderNode(&info.Children[i])
		node.Children[i] = *child
	}
	return node
}

// --- 文件监听 ---

// WatchFolder 开始监听指定目录的文件变化，通过 Wails 事件通知前端
func (s *AppService) WatchFolder(folderPath string) error {
	return s.watcherService.Watch(folderPath)
}

// --- 设置与缓存 ---

// GetSettings 获取用户设置
func (s *AppService) GetSettings() (*Settings, error) {
	info, err := s.cacheService.GetSettings()
	if err != nil {
		return nil, err
	}
	return &Settings{
		Theme:    info.Theme,
		Language: info.Language,
	}, nil
}

// SaveSettings 保存用户设置
func (s *AppService) SaveSettings(settings Settings) error {
	return s.cacheService.SaveSettings(&services.SettingsInfo{
		Theme:    settings.Theme,
		Language: settings.Language,
	})
}

// GetTagColors 获取所有标签颜色映射
func (s *AppService) GetTagColors() (map[string]string, error) {
	return s.cacheService.GetTagColors()
}

// SetTagColor 设置指定标签的颜色
func (s *AppService) SetTagColor(tag string, color string) error {
	return s.cacheService.SetTagColor(tag, color)
}

// GetFavorites 获取收藏夹路径列表
func (s *AppService) GetFavorites() ([]string, error) {
	return s.cacheService.GetFavorites()
}

// ToggleFavorite 切换路径的收藏状态
func (s *AppService) ToggleFavorite(path string) error {
	return s.cacheService.ToggleFavorite(path)
}
