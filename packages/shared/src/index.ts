/**
 * @nicenote/shared — 入口
 *
 * 所有工具函数和通用类型的统一出口
 * 消费者只需要: import { request, storage, ... } from '@nicenote/shared'
 */

// ============================================================
// 工具函数
// ============================================================
export {
  format,
  formatDate,
  formatTime,
  formatDateTime,
  formatDateUS,
  formatDateCN,
  timeAgo,
  isValidDate,
  diffDays,
  isToday,
} from './formatDate'

export { debounce, throttle } from './debounce'
export { deepClone } from './deepClone'
export { sleep, SleepAbortError } from './sleep'

export {
  randomInt,
  randomFloat,
  randomPick,
  randomSample,
  shuffle,
  weightedRandom,
  randomId,
} from './random'

export {
  required,
  minLength,
  maxLength,
  lengthRange,
  email,
  phone,
  url,
  positiveInteger,
  numeric,
  password,
  validate,
} from './validators'
export type { ValidationResult, PasswordStrength } from './validators'

export {
  parseQuery,
  toQuery,
  parseUrl,
  toKebabCase,
  toCamelCase,
  toPascalCase,
  toConstantCase,
  safeJsonParse,
  truncate,
} from './parsers'
export type { ParsedUrl } from './parsers'

export { storage, Storage, WebStorageAdapter, createAsyncStorageAdapter } from './storage'
export type { StorageAdapter } from './storage'

export { request, Request, ApiError } from './request'
export type { RequestConfig, ApiResponse as RequestResponse } from './request'

// ============================================================
// 类型
// ============================================================
export type { Note, CreateNoteRequest, UpdateNoteRequest, ApiResponse } from './types'

// ============================================================
// 常量
// ============================================================
export {
  API_TIMEOUT,
  API_RETRIES,
  API_RETRY_DELAY,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_OPTIONS,
  PAGE_SIZE_MAX,
  STORAGE_KEYS,
  TOKEN_REFRESH_THRESHOLD,
  CACHE_TTL,
  INPUT_LIMITS,
  REGEX,
  HTTP_STATUS_MESSAGES,
} from './constants'
