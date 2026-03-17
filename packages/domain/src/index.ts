/**
 * @nicenote/domain — 领域层
 *
 * Repository 接口定义（纯 TS，无 IO）
 */

// ============================================================
// Repository 接口
// ============================================================
export type { NoteRepository } from './note-repository'
export type { SearchIndex } from './search-index'
export type { Language, Settings, SettingsRepository, Theme } from './settings-repository'

// 契约测试
export { testNoteRepositoryContract } from './test-contracts/note-repository.contract'
export { testSearchIndexContract } from './test-contracts/search-index.contract'
export { testSettingsRepositoryContract } from './test-contracts/settings-repository.contract'
