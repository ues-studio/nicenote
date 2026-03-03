package services

import (
	"io/fs"
	"log"
	"path/filepath"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v3/pkg/application"
)

// WatcherService 监听文件夹内的 .md 文件变化，通过 Wails 事件通知前端
type WatcherService struct {
	watcher     *fsnotify.Watcher
	app         *application.App
	mu          sync.Mutex
	watchedPath string // 当前监听的根目录
}

// NewWatcherService 创建 WatcherService 实例
func NewWatcherService(app *application.App) *WatcherService {
	return &WatcherService{app: app}
}

// Watch 开始监听 folderPath 下的所有文件变化（自动递归添加子目录）
// 若已有监听器则先停止旧的
func (s *WatcherService) Watch(folderPath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 停止并关闭旧的监听器
	if s.watcher != nil {
		s.watcher.Close()
		s.watcher = nil
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	// 递归添加 folderPath 及其所有子目录
	if err := addDirsRecursive(watcher, folderPath); err != nil {
		watcher.Close()
		return err
	}

	s.watcher = watcher
	s.watchedPath = folderPath

	// 在后台 goroutine 中处理文件系统事件
	go s.processEvents(watcher)

	return nil
}

// Unwatch 停止文件监听
func (s *WatcherService) Unwatch() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.watcher != nil {
		err := s.watcher.Close()
		s.watcher = nil
		s.watchedPath = ""
		return err
	}
	return nil
}

// processEvents 处理 fsnotify 事件，过滤出 .md 文件事件后通过 Wails 事件发送给前端
func (s *WatcherService) processEvents(watcher *fsnotify.Watcher) {
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}

			// 若是新建目录，则自动添加监听
			if event.Has(fsnotify.Create) {
				if info, err := filepath.EvalSymlinks(event.Name); err == nil {
					_ = info
				}
				// 不阻塞：尝试添加新目录
				watcher.Add(event.Name) //nolint:errcheck
			}

			// 只处理 .md 文件
			if strings.ToLower(filepath.Ext(event.Name)) != ".md" {
				continue
			}

			payload := map[string]string{"path": event.Name}

			switch {
			case event.Has(fsnotify.Create):
				// 文件新建事件
				s.app.Event.Emit("file:created", payload)
			case event.Has(fsnotify.Write):
				// 文件修改事件
				s.app.Event.Emit("file:modified", payload)
			case event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename):
				// 文件删除或重命名（旧路径）事件
				s.app.Event.Emit("file:deleted", payload)
			}

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("文件监听器错误: %v", err)
		}
	}
}

// addDirsRecursive 递归将 root 及其所有子目录添加到 watcher
func addDirsRecursive(watcher *fsnotify.Watcher, root string) error {
	return filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // 跳过无法访问的路径
		}
		if d.IsDir() {
			// 跳过隐藏目录（如 .git、.trash）
			if strings.HasPrefix(filepath.Base(path), ".") && path != root {
				return filepath.SkipDir
			}
			return watcher.Add(path)
		}
		return nil
	})
}
