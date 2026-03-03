package main

import (
	"embed"
	"log"

	"nicenote-desktop/db"
	"nicenote-desktop/services"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	// 初始化 SQLite 缓存数据库
	database, err := db.Open()
	if err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}
	defer database.Close()

	// 初始化各服务
	cacheService := services.NewCacheService(database)
	noteService := &services.NoteService{}
	folderService := &services.FolderService{}
	searchService := &services.SearchService{}

	// 创建 Wails 应用实例
	app := application.New(application.Options{
		Name:        "NiceNote",
		Description: "Your files are your notes",
		Assets: application.AssetOptions{
			Handler: application.BundledAssetFileServer(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// 初始化文件监听服务（依赖 app 实例发送事件）
	watcherService := services.NewWatcherService(app)

	// 组装主服务
	appService := &AppService{
		noteService:    noteService,
		folderService:  folderService,
		searchService:  searchService,
		cacheService:   cacheService,
		watcherService: watcherService,
	}

	// 注册 IPC 服务
	app.RegisterService(application.NewService(appService))

	// 创建主窗口
	mainWindow := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "NiceNote",
		Width:     1200,
		Height:    800,
		MinWidth:  800,
		MinHeight: 600,
		Frameless: false,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 28,
		},
	})
	_ = mainWindow

	// 启动应用
	if err := app.Run(); err != nil {
		log.Fatalf("应用启动失败: %v", err)
	}
}
