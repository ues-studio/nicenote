# NiceNote

A note-taking app with rich text editing.

## Monorepo Structure

```
apps/
  web/          # React 19 + Vite 7 + TailwindCSS v4 frontend
  mobile/       # React Native 0.79 (iOS/Android)
packages/
  database/     # op-sqlite + Drizzle ORM (native apps)
  store/        # Zustand v5 + Immer (native apps)
  editor-bridge/# Tiptap WebView bridge (native apps)
  ui-native/    # Native UI components
  editor/       # Tiptap v3 rich text editor component
  ui/           # Radix UI based component library
  tokens/       # Design tokens (colors, typography, spacing, shadows)
  shared/       # Shared utilities, types, constants
```

## Tech Stack

- **Runtime**: pnpm v10 monorepo + Turborepo
- **Language**: TypeScript 5.9 (strict mode, `bundler` module resolution)
- **Frontend**: React 19, Vite 7, TailwindCSS v4, Zustand v5
- **Native**: React Native 0.79 (iOS/Android)
- **Database (Native)**: op-sqlite, Drizzle ORM
- **Validation**: Zod v4
- **Editor**: Tiptap v3 (ProseMirror), react-native-webview (native apps)
- **UI Primitives**: Radix UI, Floating UI
- **Linting**: ESLint 9 (flat config) + Prettier (single quotes, no semicolons, 100 width)
- **Git Hooks**: Husky + lint-staged

## Key Commands

```bash
# Root (monorepo)
pnpm dev                # Start all apps/packages in dev mode
pnpm build              # Build all (via Turborepo)
pnpm lint               # Lint all packages

# Web (apps/web)
pnpm --filter web dev            # Vite dev server (port 5173)
pnpm --filter web build          # Build (generates CSS from tokens first)
pnpm --filter web generate:css   # Regenerate CSS from design tokens

# Mobile (apps/mobile & packages/editor-bridge)
pnpm --filter @nicenote/editor-bridge build:template # Build Tiptap editor HTML bundle (must run before launching mobile app)
pnpm --filter nicenote-mobile ios                    # Launch on iOS
pnpm --filter nicenote-mobile android                # Launch on Android
```

## Architecture

### State Management

Zustand store at `apps/web/src/store/useNoteStore.ts`。Web 应用的数据层已移除（原 Cloudflare Workers API），待接入新数据源。

### Theme System

Design tokens in `packages/tokens/` are compiled to CSS variables via `apps/web/scripts/generate-css.ts`. Dark mode uses Tailwind's `class` strategy with localStorage persistence (`nicenote-theme` key). Flash prevention via inline script in `index.html`.

### Editor Package

Tiptap v3 editor at `packages/editor/src/index.ts` with extensions: StarterKit (includes Link), TextAlign, Typography, Placeholder, Markdown. Content stored as Markdown format.

### UI Package

Components: Button, DropdownMenu, Popover, Tooltip, Input, Separator, Toolbar.
Utility: `cn()` from `packages/ui/src/lib/utils.ts` (clsx + tailwind-merge).
Hooks: useIsBreakpoint, useThrottledCallback, useComposedRef, useMenuNavigation.

### Shared Package

Exports: async utils (debounce, throttle), parsers (toKebabCase), validators (getLinkValidationError).
Types/Schemas: NoteSelect, NoteInsert, NoteCreateInput, NoteUpdateInput, NoteListItem, NoteListQuery, NoteListResult, NoteContractService, and corresponding Zod schemas.

## Conventions

- Internal packages use `workspace:*` protocol
- Vite path alias: `@` maps to `packages/editor/src` in web app
- All packages export from their `src/index.ts` (or `src/index.tsx`)
- Prettier: single quotes, no semicolons, 100 char width
- Strict TypeScript, bundler module resolution
- Functional components with hooks, forwardRef for ref forwarding
- CSS variables for themeable values via design tokens
- Mobile-first responsive design (breakpoints: sm=640, md=768, lg=1024, xl=1280)
- Editor link input must use non-blocking UI (Popover/Modal + validation); do not use `window.prompt`
- **Native ID Generation**: `nanoid/non-secure` for id generation in native (no crypto dependency)
- **Native Store**: Store files use lazy `svc()` accessor (creates new service instance each call — stateless)
- **Native DB**: op-sqlite is a peer dependency of `@nicenote/database`

## Deployment

- **CI/CD**: GitHub Actions (ci-cd.yml)

## Implementation Principles

- Converge directly: choose the shortest workable path.
- No unnecessary compatibility layers.
- Remove redundant/obsolete code proactively.
- Optimize readability, testability, and maintainability.

## 注释规范

代码中的注释使用中文。
