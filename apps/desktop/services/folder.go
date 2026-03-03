package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// FolderService 提供文件夹树结构操作
type FolderService struct{}

// FolderNodeInfo 内部使用的目录树节点（与 main 包的 FolderNode 对应）
type FolderNodeInfo struct {
	Path      string
	Name      string
	Children  []FolderNodeInfo
	NoteCount int
}

// GetFolderTree 获取 rootPath 下的文件夹树（仅包含含有 .md 文件的目录）
func (s *FolderService) GetFolderTree(rootPath string) (*FolderNodeInfo, error) {
	info, err := os.Stat(rootPath)
	if err != nil {
		return nil, fmt.Errorf("访问目录 %s 失败: %w", rootPath, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("%s 不是目录", rootPath)
	}

	node, err := buildFolderNode(rootPath)
	if err != nil {
		return nil, err
	}
	return node, nil
}

// buildFolderNode 递归构建目录节点，统计 .md 文件数量
func buildFolderNode(path string) (*FolderNodeInfo, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, fmt.Errorf("读取目录 %s 失败: %w", path, err)
	}

	node := &FolderNodeInfo{
		Path:     path,
		Name:     filepath.Base(path),
		Children: []FolderNodeInfo{},
	}

	for _, entry := range entries {
		// 跳过隐藏条目（以 . 开头）
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		fullPath := filepath.Join(path, entry.Name())

		if entry.IsDir() {
			child, err := buildFolderNode(fullPath)
			if err != nil {
				continue // 跳过无法读取的子目录
			}
			// 仅将包含 .md 文件的子目录加入树中（子目录的 NoteCount 包含其所有后代）
			if child.NoteCount > 0 {
				node.Children = append(node.Children, *child)
				node.NoteCount += child.NoteCount
			}
			continue
		}

		// 统计当前目录下的 .md 文件
		if strings.ToLower(filepath.Ext(entry.Name())) == ".md" {
			node.NoteCount++
		}
	}

	return node, nil
}
