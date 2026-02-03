# Nicenote Project Structure & Codebase Overview

## Project Overview
Nicenote is a full-stack note-taking application built with React and Cloudflare Workers, utilizing a pnpm workspace monorepo architecture. The project consists of a frontend application, API backend, and multiple shared packages, supporting real-time editing and data persistence.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Hono (Cloudflare Workers), TypeScript
- **Database**: SQLite with Drizzle ORM (Cloudflare D1)
- **Editor**: Tiptap (Rich Text Editor)
- **State Management**: Zustand
- **UI Components**: Custom @nicenote/ui package
- **Design System**: @nicenote/tokens package
- **Build Tools**: Turborepo, pnpm
- **Code Quality**: ESLint, Prettier, Husky

## Project Structure
```
nice-note/
├── apps/
│   ├── api/           # Cloudflare Workers API service
│   └── web/           # React frontend application
├── packages/
│   ├── editor/        # Rich text editor component package
│   ├── shared/        # Shared utilities and types
│   ├── tokens/        # Design tokens and theme system
│   └── ui/            # UI primitive component library
├── scripts/           # Build scripts
└── root files         # Workspace configuration files
```

## Applications

### API Application (apps/api)
**Framework**: Hono.js running on Cloudflare Workers

**Key Features**:
- Database integration using Drizzle ORM with Cloudflare D1 SQLite
- RESTful API endpoints for note CRUD operations
- Request validation using Zod schemas
- Wrangler configuration for Cloudflare deployment

**Database Schema**:
- `notes` table: Stores note data (id, title, content, created_at, updated_at)

**API Endpoints**:
- `GET /` - API health check
- `GET /notes` - Retrieve all notes
- `GET /notes/:id` - Retrieve specific note
- `POST /notes` - Create new note
- `PATCH /notes/:id` - Update existing note
- `DELETE /notes/:id` - Delete note

### Web Application (apps/web)
**Framework**: React 19 with TypeScript

**Key Features**:
- Vite as build tool for fast development and optimized production builds
- Zustand for lightweight state management
- Integration with @nicenote/ui and @nicenote/editor packages
- TailwindCSS with custom theme system
- Custom API client for backend communication

## Packages

### @nicenote/editor
**Purpose**: Tiptap-based rich text editor component

**Core Capabilities**:
- Multiple text formatting options (bold, italic, underline, strikethrough)
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Image insertion
- Table of Contents (TOC) generation
- Placeholder support
- Responsive layout

**Dependencies**: @tiptap/* extensions, @nicenote/ui

### @nicenote/tokens
**Purpose**: Design tokens and theming system

**Features**:
- Centralized design properties (colors, spacing, typography)
- Light and dark mode support
- CSS variable generation via `generate-theme.ts` script
- Type-safe token access

### @nicenote/ui
**Purpose**: Reusable UI primitive component library

**Components**: Button, Card, Badge, Tooltip, Popover, and more

**Dependencies**: 
- Radix UI for accessible primitives
- Floating UI for positioning
- Lucide React for icons

**Utilities**: `cn` function (clsx + tailwind-merge) for className management

### @nicenote/shared
**Purpose**: Shared utilities and type definitions

**Content**: Cross-application utilities, common types, and helper functions

## Configuration Files

### Database
- **Location**: `apps/api/drizzle/`
- **Tool**: Drizzle Kit for migrations
- **Driver**: SQLite with D1 HTTP driver

### Build Configuration
- **Root**: `turbo.json` - Turborepo pipeline configuration
- **Frontend**: `vite.config.ts`, `tailwind.config.ts`
- **API**: `wrangler.jsonc` - Cloudflare Workers configuration

### Package Management
- `pnpm-workspace.yaml` - Workspace definition
- Individual `package.json` files in root, apps/api, and apps/web

## Important Notes

1. **Type Definitions**: `@types/node` is intentionally disabled in certain packages (notably packages/editor) to avoid conflicts
2. **Theme System**: Dynamic theme switching implemented via `useTheme` hook and CSS variables
3. **Editor State**: Editor content is stored in the database as Tiptap's JSON format
4. **Type Generation**: Wrangler generates Cloudflare binding types automatically
5. **Code Quality**: Enforced through ESLint, Prettier, and Husky pre-commit hooks

## Development Commands

```bash
pnpm dev              # Start development servers (frontend + backend)
pnpm build            # Build for production
pnpm lint             # Run linting checks
pnpm generate:theme   # Generate theme CSS variables
pnpm deploy           # Deploy API to Cloudflare Workers
```

## Architecture Highlights

### Monorepo Benefits
- Shared code across applications and packages
- Consistent tooling and configuration
- Simplified dependency management
- Efficient build caching with Turborepo

### Cloudflare Integration
- Edge-deployed API for low latency
- D1 database for serverless SQLite
- Global distribution via Cloudflare's network

### Type Safety
- End-to-end TypeScript coverage
- Shared types between frontend and backend
- Zod schemas for runtime validation