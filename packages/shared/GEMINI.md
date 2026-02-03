# Shared Package (@nicenote/shared) - Detailed Documentation

## Overview
The Shared package is the project's common utility library, containing reusable utility functions, constants, type definitions, and other utilities shared across applications and packages. It serves as the foundational layer for common operations, ensuring consistency and reducing code duplication throughout the monorepo.

## Tech Stack
- **Language**: TypeScript - Full type safety and modern JavaScript features
- **Build Tool**: TypeScript Compiler (tsc) - Compiles TypeScript to JavaScript
- **Type Safety**: Complete TypeScript type definitions with strict mode enabled
- **Testing**: Vitest (optional) - Unit testing framework
- **Code Quality**: ESLint, Prettier

## Directory Structure
```
packages/shared/
├── src/
│   ├── constants.ts      # Project-wide constant definitions
│   ├── debounce.ts       # Debounce utility implementation
│   ├── deepClone.ts      # Deep cloning utility
│   ├── formatDate.ts     # Date formatting utilities
│   ├── index.ts          # Main export entry point for all utilities
│   ├── parsers.ts        # Data parsing utilities
│   ├── random.ts         # Random number and selection utilities
│   ├── request.ts        # HTTP request wrapper utilities
│   ├── sleep.ts          # Async delay utilities
│   ├── storage.ts        # Local storage wrapper utilities
│   ├── types.ts          # Shared TypeScript type definitions
│   └── validators.ts     # Input validation utilities
├── dist/                 # Compiled output directory (generated)
│   ├── index.js          # Compiled JavaScript
│   ├── index.d.ts        # Type definitions
│   └── [module].js       # Individual compiled modules
├── package.json          # Package configuration and dependencies
└── tsconfig.json         # TypeScript compiler configuration
```

## Core Utility Modules

### 1. constants.ts
**Purpose**: Centralized constant definitions for project-wide use

**Contents**:
- API endpoint URLs and base paths
- Configuration parameters (timeouts, limits, thresholds)
- Feature flags and environment constants
- Error messages and status codes
- UI-related constants (animation durations, breakpoints)

**Example**:
```typescript
export const API_BASE_URL = process.env.API_URL || 'http://localhost:8787';
export const DEFAULT_DEBOUNCE_DELAY = 300;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const STORAGE_KEYS = {
  THEME: 'app-theme',
  USER_PREFERENCES: 'user-preferences',
} as const;
```

**Benefits**:
- Single source of truth for configuration
- Easy to update across entire codebase
- Type-safe constant access
- Environment-specific configurations

---

### 2. debounce.ts
**Purpose**: Function execution rate limiting for performance optimization

**Functionality**:
- Debounce function calls to reduce execution frequency
- Configurable delay timing
- Leading/trailing edge execution options
- TypeScript generic support for any function signature

**Use Cases**:
- Search input handling
- Window resize handlers
- Auto-save functionality
- API request throttling

**Implementation**:
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300,
  options?: { leading?: boolean; trailing?: boolean }
): (...args: Parameters<T>) => void;
```

**Example Usage**:
```typescript
const handleSearch = debounce((query: string) => {
  // API call
}, 300);
```

---

### 3. deepClone.ts
**Purpose**: Deep cloning of complex JavaScript objects and arrays

**Features**:
- Recursive deep cloning
- Handles nested objects and arrays
- Preserves Date, RegExp, and other special types
- Circular reference detection
- TypeScript generic typing for return type safety

**Use Cases**:
- Immutable state updates
- Creating copies for editing without mutation
- Snapshot functionality
- Data transformation pipelines

**Implementation**:
```typescript
export function deepClone<T>(obj: T): T;
```

**Example**:
```typescript
const original = { nested: { data: [1, 2, 3] } };
const copy = deepClone(original);
copy.nested.data.push(4); // Original remains unchanged
```

---

### 4. formatDate.ts
**Purpose**: Comprehensive date and time formatting utilities

**Features**:
- Multiple date format presets (ISO, locale-specific, relative)
- Timezone handling
- Relative time formatting ("2 hours ago", "yesterday")
- Custom format string support
- Localization support

**Formats**:
- `formatDate(date, 'full')` → "Monday, January 1, 2024"
- `formatDate(date, 'short')` → "1/1/24"
- `formatDate(date, 'iso')` → "2024-01-01T00:00:00.000Z"
- `formatRelativeTime(date)` → "2 hours ago"

**Use Cases**:
- Displaying created/updated timestamps
- Log formatting
- User-facing date displays
- API date serialization

**Example**:
```typescript
export function formatDate(date: Date | string, format: DateFormat): string;
export function formatRelativeTime(date: Date | string): string;
export function parseDate(dateString: string): Date | null;
```

---

### 5. parsers.ts
**Purpose**: Safe data parsing and transformation utilities

**Features**:
- Safe JSON parsing with error handling
- Query string parsing and serialization
- Number parsing with validation
- Boolean coercion from various formats
- CSV/TSV parsing utilities

**Functions**:
- `safeJSONParse<T>(str: string, fallback?: T): T` - Parse JSON with fallback
- `parseQueryString(query: string): Record<string, string>` - Parse URL query
- `stringifyQueryString(params: object): string` - Serialize to query string
- `parseBoolean(value: any): boolean` - Safe boolean conversion
- `parseNumber(value: any, fallback?: number): number` - Safe number parsing

**Use Cases**:
- API response parsing
- URL parameter handling
- User input parsing
- Configuration file reading

**Example**:
```typescript
const data = safeJSONParse<User>(response, { id: '', name: 'Unknown' });
const params = parseQueryString(window.location.search);
```

---

### 6. random.ts
**Purpose**: Random number generation and selection utilities

**Features**:
- Cryptographically secure random IDs
- Random number generation within ranges
- Random array element selection
- Weighted random selection
- UUID generation

**Functions**:
- `generateId(length?: number): string` - Generate unique ID
- `randomInt(min: number, max: number): number` - Random integer
- `randomFloat(min: number, max: number): number` - Random float
- `randomElement<T>(array: T[]): T` - Pick random element
- `randomElements<T>(array: T[], count: number): T[]` - Pick multiple
- `shuffle<T>(array: T[]): T[]` - Shuffle array (Fisher-Yates)

**Use Cases**:
- Generating temporary IDs
- Sampling data for testing
- Random color/theme selection
- Shuffling content order

**Example**:
```typescript
const userId = generateId(16); // "a3f9c8e2d1b5f4a7"
const randomNote = randomElement(notes);
const shuffledCards = shuffle(deck);
```

---

### 7. request.ts
**Purpose**: HTTP request wrapper with consistent error handling

**Features**:
- Fetch API wrapper with TypeScript support
- Automatic JSON parsing
- Request/response interceptors
- Error handling and retry logic
- Timeout configuration
- Request cancellation support

**Functions**:
- `request<T>(url: string, options?: RequestOptions): Promise<T>`
- `get<T>(url: string, options?: RequestOptions): Promise<T>`
- `post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>`
- `put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>`
- `patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T>`
- `del<T>(url: string, options?: RequestOptions): Promise<T>`

**Use Cases**:
- API communication
- File uploads/downloads
- Polling and long-polling
- WebSocket fallback

**Example**:
```typescript
const user = await get<User>('/api/users/123');
const created = await post<Note>('/api/notes', { title: 'New Note' });
```

---

### 8. sleep.ts
**Purpose**: Promise-based delay utility for async workflows

**Features**:
- Simple async/await delay
- TypeScript Promise typing
- Cancellable sleep (optional)
- Useful for testing and animations

**Implementation**:
```typescript
export function sleep(ms: number): Promise<void>;
```

**Use Cases**:
- Adding delays in async sequences
- Rate limiting API calls
- Animation timing
- Testing async behavior
- Retry logic with backoff

**Example**:
```typescript
async function retryWithBackoff(fn: () => Promise<any>, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < attempts - 1) {
        await sleep(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  throw new Error('Max retry attempts exceeded');
}
```

---

### 9. storage.ts
**Purpose**: Type-safe wrapper for browser storage APIs

**Features**:
- localStorage and sessionStorage wrappers
- Automatic JSON serialization/deserialization
- Type-safe get/set operations
- Error handling for quota exceeded
- Fallback for unavailable storage
- Storage event listening

**Functions**:
- `getItem<T>(key: string, defaultValue?: T): T | null`
- `setItem<T>(key: string, value: T): boolean`
- `removeItem(key: string): void`
- `clear(): void`
- `getAllKeys(): string[]`
- `getSize(): number` - Get total storage size

**Use Cases**:
- Persisting user preferences
- Caching API responses
- Saving draft content
- Session management
- Feature flag storage

**Example**:
```typescript
// Type-safe storage operations
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

setItem<UserPreferences>('preferences', { theme: 'dark', language: 'en' });
const prefs = getItem<UserPreferences>('preferences');
```

---

### 10. types.ts
**Purpose**: Shared TypeScript type definitions and interfaces

**Contents**:
- Common entity types (User, Note, etc.)
- API request/response types
- Utility types and helpers
- Generic type aliases
- Branded types for type safety

**Type Categories**:

**Entity Types**:
```typescript
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
```

**API Types**:
```typescript
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export type ApiError = {
  message: string;
  code: string;
  details?: unknown;
};
```

**Utility Types**:
```typescript
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : any;
```

---

### 11. validators.ts
**Purpose**: Input validation and sanitization utilities

**Features**:
- Email validation (RFC-compliant regex)
- URL validation
- String length validation
- Number range validation
- Custom validation rules
- Sanitization utilities

**Functions**:
- `isValidEmail(email: string): boolean`
- `isValidURL(url: string): boolean`
- `isValidLength(str: string, min: number, max: number): boolean`
- `isInRange(num: number, min: number, max: number): boolean`
- `sanitizeHTML(html: string): string`
- `validateRequired(value: any): boolean`
- `validatePattern(value: string, pattern: RegExp): boolean`

**Use Cases**:
- Form validation
- API input validation
- User input sanitization
- Configuration validation
- Security checks

**Example**:
```typescript
const isValid = isValidEmail('user@example.com'); // true
const sanitized = sanitizeHTML('<script>alert("xss")</script>'); // ''
```

---

## Package Configuration

### Build Configuration
**Output Formats**: 
- ESM (ES Modules) for modern bundlers
- CommonJS for Node.js compatibility
- Type definitions (.d.ts) for TypeScript users

**TypeScript Config**:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  }
}
```

### Package.json Exports
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

## Development Commands

```bash
pnpm build         # Compile TypeScript to JavaScript
pnpm dev           # Build in watch mode for development
pnpm lint          # Run ESLint code quality checks
pnpm typecheck     # TypeScript type validation without emit
pnpm test          # Run unit tests (if configured)
pnpm clean         # Remove dist directory
```

---

## Usage Guidelines

### Installation
Within the monorepo, packages reference this via workspace protocol:
```json
{
  "dependencies": {
    "@nicenote/shared": "workspace:*"
  }
}
```

### Importing
```typescript
// Import specific utilities
import { debounce, formatDate, deepClone } from '@nicenote/shared';

// Import types
import type { Note, ApiResponse } from '@nicenote/shared';

// Import constants
import { API_BASE_URL, STORAGE_KEYS } from '@nicenote/shared';
```

### Tree-Shaking
The package is optimized for tree-shaking. Only imported utilities are included in the final bundle.

---

## Design Principles

### 1. Pure Functions
- All utility functions are pure (no side effects)
- Same input always produces same output
- No mutation of input parameters
- Easier to test and reason about

### 2. Type Safety
- Full TypeScript coverage with strict mode
- Generic types for flexibility
- Type guards where appropriate
- No `any` types unless absolutely necessary

### 3. Functional Programming
- Composition over inheritance
- Immutability by default
- Higher-order functions
- Minimal dependencies

### 4. Zero Dependencies
- No external runtime dependencies
- Reduces bundle size
- Eliminates security vulnerabilities from deps
- Full control over implementations

### 5. Single Responsibility
- Each module has one clear purpose
- Functions do one thing well
- Easy to locate and understand
- Promotes reusability

---

## Testing Strategy

### Unit Testing
- Test each utility function in isolation
- Cover edge cases and error conditions
- Mock external dependencies (storage, network)
- Aim for 100% code coverage

### Example Test Structure
```typescript
describe('debounce', () => {
  it('should delay function execution', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    
    debounced();
    expect(fn).not.toHaveBeenCalled();
    
    await sleep(150);
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

---

## Performance Considerations

### Bundle Size
- Individual module exports for tree-shaking
- No heavy dependencies
- Minimal runtime overhead
- Optimized build output

### Memory Usage
- Avoid memory leaks in storage utilities
- Cleanup event listeners
- Efficient data structures
- Garbage collection friendly

### Execution Speed
- Optimized algorithms (e.g., Fisher-Yates shuffle)
- Avoid unnecessary computations
- Lazy evaluation where appropriate
- Benchmark critical paths

---

## Best Practices

### When to Add New Utilities
✅ **Add when**:
- Function is used in 2+ packages/apps
- Logic is complex and benefits from centralization
- Needs comprehensive testing
- Has clear, reusable purpose

❌ **Don't add when**:
- Used in only one place
- Trivial one-liner that adds indirection
- Highly specific to one domain
- Better suited as inline code

### Function Design
- Keep functions small and focused
- Use descriptive names
- Provide comprehensive JSDoc comments
- Include usage examples in comments
- Handle edge cases gracefully

### Type Definitions
- Define shared types here
- Use `export type` for type-only exports
- Avoid circular dependencies
- Document complex types with comments

---

## Error Handling

### Consistent Error Patterns
```typescript
// Return null for not-found scenarios
export function getItem<T>(key: string): T | null {
  try {
    // ... implementation
  } catch (error) {
    console.error('Storage error:', error);
    return null;
  }
}

// Throw for exceptional conditions
export function validateEmail(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }
}
```

---

## Migration & Versioning

### Semantic Versioning
- **Major**: Breaking changes to public API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, no API changes

### Breaking Changes
- Provide migration guides
- Deprecate before removing
- Update all consuming packages simultaneously
- Document in CHANGELOG

---

## Future Enhancements

### Planned Utilities
- Advanced caching utilities with TTL
- Internationalization (i18n) helpers
- Advanced data transformation pipelines
- Encryption/decryption utilities
- Schema validation with Zod integration
- Performance monitoring utilities

### Improvements
- Add comprehensive JSDoc comments
- Create interactive documentation site
- Add runtime validation in development
- Implement logging and debugging utilities
- Create utility composition helpers

---

## Contributing Guidelines

### Adding New Utilities
1. Create new file in `src/` with descriptive name
2. Implement with full TypeScript typing
3. Add comprehensive JSDoc comments
4. Export from `src/index.ts`
5. Write unit tests
6. Update documentation
7. Ensure tree-shaking compatibility

### Code Style
- Follow existing patterns
- Use TypeScript strict mode
- Write self-documenting code
- Add comments for complex logic
- Run linter before committing