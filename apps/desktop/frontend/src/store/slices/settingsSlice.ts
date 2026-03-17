import type { StateCreator } from 'zustand'

import { applyLanguageToDOM, applyThemeToDOM } from '@nicenote/app-shell'

import type { Settings } from '../../bindings/tauri'
import { AppService } from '../../bindings/tauri'
import type { DesktopStore } from '../useDesktopStore'

const THEME_STORAGE_KEY = 'nicenote-desktop-theme'
const LANG_STORAGE_KEY = 'nicenote-desktop-lang'

export type CurrentView = 'all' | 'tags' | 'favorites' | 'folder-tree'

export interface SettingsSlice {
  // 视图状态
  currentView: CurrentView
  selectedTag: string | null

  // 应用设置
  settings: Settings
  tagColors: Record<string, string>
  favorites: string[]

  // 视图操作
  setCurrentView: (view: CurrentView) => void
  setSelectedTag: (tag: string | null) => void

  // 收藏操作
  toggleFavorite: (path: string) => Promise<void>
  loadFavorites: () => Promise<void>

  // 设置操作
  loadSettings: () => Promise<void>
  saveSettings: (settings: Partial<Settings>) => Promise<void>
  loadTagColors: () => Promise<void>
  setTagColor: (tag: string, color: string) => Promise<void>
}

export const createSettingsSlice: StateCreator<DesktopStore, [], [], SettingsSlice> = (
  set,
  get
) => ({
  currentView: 'all',
  selectedTag: null,
  settings: { theme: 'system', language: 'zh' },
  tagColors: {},
  favorites: [],

  setCurrentView: (view: CurrentView) => {
    set({ currentView: view, selectedTag: null })
  },

  setSelectedTag: (tag: string | null) => {
    set({ selectedTag: tag, currentView: 'all' })
  },

  toggleFavorite: async (path: string) => {
    try {
      await AppService.toggleFavorite(path)
      await get().loadFavorites()
    } catch (err) {
      console.error('切换收藏失败:', err)
    }
  },

  loadFavorites: async () => {
    try {
      const favorites = await AppService.getFavorites()
      set({ favorites })
    } catch (err) {
      console.error('加载收藏失败:', err)
    }
  },

  loadSettings: async () => {
    try {
      const settings = await AppService.getSettings()
      if (!settings) return
      set({ settings })
      applyThemeToDOM(settings.theme)
      localStorage.setItem(THEME_STORAGE_KEY, settings.theme)
      applyLanguageToDOM(settings.language)
      localStorage.setItem(LANG_STORAGE_KEY, settings.language)
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  },

  saveSettings: async (patch: Partial<Settings>) => {
    const prev = get().settings
    const updated: Settings = { ...prev, ...patch }
    set({ settings: updated })
    if (patch.theme) {
      applyThemeToDOM(patch.theme)
      localStorage.setItem(THEME_STORAGE_KEY, patch.theme)
    }
    if (patch.language) {
      applyLanguageToDOM(patch.language)
      localStorage.setItem(LANG_STORAGE_KEY, patch.language)
    }
    try {
      await AppService.saveSettings(updated)
    } catch (err) {
      console.error('保存设置失败:', err)
      // IPC 失败时回滚设置
      set({ settings: prev })
      applyThemeToDOM(prev.theme)
      localStorage.setItem(THEME_STORAGE_KEY, prev.theme)
      applyLanguageToDOM(prev.language)
      localStorage.setItem(LANG_STORAGE_KEY, prev.language)
    }
  },

  loadTagColors: async () => {
    try {
      const tagColors = await AppService.getTagColors()
      set({ tagColors })
    } catch (err) {
      console.error('加载标签颜色失败:', err)
    }
  },

  setTagColor: async (tag: string, color: string) => {
    const prevColors = get().tagColors
    set({ tagColors: { ...prevColors, [tag]: color } })
    try {
      await AppService.setTagColor(tag, color)
    } catch (err) {
      console.error('设置标签颜色失败:', err)
      // IPC 失败时回滚到之前的颜色
      set({ tagColors: prevColors })
    }
  },
})
