/**
 * 设置仓储接口
 */
export type Theme = 'light' | 'dark' | 'system'
export type Language = 'en' | 'zh'

export interface Settings {
  theme: Theme
  language: Language
}

export interface SettingsRepository {
  get(): Promise<Settings>
  save(settings: Settings): Promise<void>
}
