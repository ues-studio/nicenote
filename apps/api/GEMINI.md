# API Application (apps/api) - Detailed Documentation

## Overview
The API application is a Hono.js-based Cloudflare Workers service that handles all backend logic and database operations for the note-taking application. It provides a RESTful API interface with type-safe database operations and request validation.

## Tech Stack
- **Framework**: Hono.js - Lightweight web framework optimized for edge computing
- **Runtime**: Cloudflare Workers - Edge-deployed serverless platform
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM for type-safe queries
- **Validation**: Zod schemas with @hono/zod-validator middleware
- **ID Generation**: nanoid - Secure, URL-friendly unique string generator
- **Type Definitions**: @cloudflare/workers-types for Cloudflare bindings

## Directory Structure
```
apps/api/
├── drizzle/              # Database migration files
│   ├── meta/             # Migration metadata and snapshots
│   ├── 0000_xxx.sql      # Initial schema migration
│   └── 0001_xxx.sql      # Subsequent migrations
├── src/
│   ├── db/
│   │   └── schema.ts     # Database schema definitions (Drizzle)
│   └── index.ts          # Main application entry point
├── drizzle.config.ts     # Drizzle Kit configuration
├── wrangler.jsonc        # Cloudflare Workers configuration
└── package.json          # Dependencies and scripts
```

## Database Schema

### Notes Table
**Table Name**: `notes`

**Columns**:
- `id` (text, PRIMARY KEY) - Unique identifier generated using nanoid
- `title` (text, NOT NULL) - Note title, defaults to 'Untitled'
- `content` (text, NOT NULL) - Note content in Tiptap JSON format
- `createdAt` (text, NOT NULL) - ISO 8601 timestamp string
- `updatedAt` (text, NOT NULL) - ISO 8601 timestamp string

**Indexes**: Primary key on `id`, implicit index on `updatedAt` for sorting

## API Endpoints

### Health Check
**GET** `/`
- **Description**: Returns API status and basic information
- **Response**: Status message confirming API is operational

### List All Notes
**GET** `/notes`
- **Description**: Retrieves all notes, sorted by most recently updated
- **Response**: Array of note objects
- **Sorting**: Descending order by `updatedAt`

### Get Single Note
**GET** `/notes/:id`
- **Description**: Retrieves a specific note by ID
- **Parameters**: `id` (path parameter) - Note ID
- **Response**: Note object if found
- **Error**: 404 if note doesn't exist

### Create Note
**POST** `/notes`
- **Description**: Creates a new note
- **Request Body** (optional):
  - `title` (string, optional) - Note title
  - `content` (string, optional) - Note content in Tiptap JSON format
- **Validation**: Zod schema validation
- **Response**: Created note object with generated ID and timestamps

### Update Note
**PATCH** `/notes/:id`
- **Description**: Updates an existing note
- **Parameters**: `id` (path parameter) - Note ID
- **Request Body** (optional):
  - `title` (string, optional) - Updated note title
  - `content` (string, optional) - Updated note content
- **Validation**: Zod schema validation
- **Response**: Updated note object with new `updatedAt` timestamp
- **Error**: 404 if note doesn't exist

### Delete Note
**DELETE** `/notes/:id`
- **Description**: Deletes a specific note
- **Parameters**: `id` (path parameter) - Note ID
- **Response**: Success confirmation
- **Error**: 404 if note doesn't exist

## Configuration

### Database Connection
- **Binding**: Configured via `wrangler.jsonc` to bind Cloudflare D1 database
- **Connection**: Accessed through Hono context bindings at runtime
- **Environment**: Separate bindings for development and production

### Migration Management
- **Tool**: Drizzle Kit for schema migrations
- **Strategy**: SQL-based migrations with automatic generation from schema changes
- **Versioning**: Sequential migration files with metadata tracking

### Type Generation
- **Command**: `wrangler types` generates TypeScript definitions
- **Output**: Cloudflare Worker bindings and environment types
- **Purpose**: Ensures type safety for D1 database and other Cloudflare resources

## Development Commands

```bash
pnpm dev              # Start local development server with hot reload
pnpm deploy           # Deploy to Cloudflare Workers
pnpm db:migrate       # Run migrations on local D1 database
pnpm db:migrate:prod  # Run migrations on production D1 database
pnpm db:studio        # Launch Drizzle Studio for database inspection
pnpm cf-typegen       # Generate Cloudflare Worker types
pnpm lint             # Run ESLint code quality checks
```

## Implementation Details

### Type Safety
- **ORM**: Drizzle ORM provides end-to-end type safety from schema to queries
- **Validation**: Zod schemas ensure runtime type validation for API requests
- **TypeScript**: Strict mode enabled for maximum type checking

### Data Storage
- **Format**: Note content stored as Tiptap JSON format
- **Benefits**: 
  - Rich text formatting support
  - Extensible content structure
  - Easy serialization/deserialization
- **DateTime**: All timestamps stored as ISO 8601 strings for consistency

### Error Handling
- Proper HTTP status codes (200, 404, 500)
- Validation errors return detailed messages
- Database errors handled gracefully

### Performance Considerations
- Edge deployment for low latency worldwide
- SQLite database co-located with Worker for fast queries
- Efficient indexing on frequently queried columns

## Security

### Input Validation
- All request bodies validated with Zod schemas
- SQL injection prevented by Drizzle ORM's prepared statements
- Input sanitization for user-provided content

### CORS Configuration
- Configured for allowed origins (frontend application)
- Proper handling of preflight requests

## Deployment

### Production Deployment
1. Run production migrations: `pnpm db:migrate:prod`
2. Deploy Worker: `pnpm deploy`
3. Verify deployment via Cloudflare dashboard

### Environment Variables
- Database binding name: Configured in `wrangler.jsonc`
- No API keys required (using Cloudflare's native authentication)

## Monitoring & Debugging

### Cloudflare Dashboard
- Real-time request logs
- Error tracking and analytics
- Performance metrics

### Local Development
- Wrangler provides local D1 database simulation
- Console logging for debugging
- Drizzle Studio for database inspection

## Future Considerations
- Add authentication/authorization layer
- Implement rate limiting
- Add full-text search capabilities
- Consider caching strategies for frequently accessed notes
- Add soft delete functionality for note recovery