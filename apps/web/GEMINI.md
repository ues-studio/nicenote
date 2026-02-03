# Web Application (apps/web) - Detailed Documentation

## Overview
The Web application is a React 19-based frontend interface that provides a user-friendly note editing and management experience. It communicates with the API backend for data persistence and implements a modern, responsive design with theme customization capabilities.

## Tech Stack
- **Framework**: React 19 - Latest React with improved performance and concurrent features
- **Language**: TypeScript - Full type safety across the application
- **Build Tool**: Vite - Fast HMR and optimized production builds
- **Styling**: TailwindCSS - Utility-first CSS framework with custom theme system
- **State Management**: Zustand - Lightweight, hook-based state management
- **UI Components**: @nicenote/ui, @nicenote/editor - Internal component packages
- **Icons**: Lucide React - Consistent, customizable icon set
- **Date Utilities**: date-fns - Modern date manipulation library
- **Utilities**: lodash - Common utility functions

## Directory Structure
```
apps/web/
├── public/               # Static assets (served as-is)
├── scripts/              # Build and generation scripts
│   └── generate-theme.ts # Theme CSS variable generator
├── src/
│   ├── assets/          # Application assets (images, fonts, etc.)
│   ├── components/      # Reusable UI components
│   │   └── ThemeToggle.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useTheme.ts
│   ├── lib/             # Utility functions and helpers
│   │   └── api.ts       # API client with request/response handling
│   ├── store/           # Zustand state management
│   │   └── useNoteStore.ts
│   ├── styles/          # Global styles and CSS modules
│   ├── App.tsx          # Main application component
│   ├── index.css        # Global styles and CSS variables
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── vite.config.ts       # Vite bundler configuration
└── eslint.config.js     # ESLint linting rules
```

## Core Features

### Note Management
- **List View**: Display all notes with sorting and filtering
- **Create**: Quick note creation with default templates
- **Edit**: Rich text editing with Tiptap integration
- **Delete**: Safe deletion with confirmation
- **Auto-save**: Automatic persistence to backend with debouncing

### User Experience
- **Real-time Updates**: Immediate UI feedback with optimistic updates
- **Theme Support**: Light and dark mode with system preference detection
- **Responsive Design**: Mobile-first approach, works on all screen sizes
- **Keyboard Shortcuts**: Enhanced productivity with keyboard navigation

### Performance
- **Code Splitting**: Lazy loading of routes and components
- **Optimized Bundling**: Vite's efficient build system
- **Asset Optimization**: Image compression and lazy loading

## Core Components & Architecture

### Application Components

**App.tsx**
- Main application container
- Route configuration and layout management
- Global state initialization
- Error boundary implementation

**ThemeToggle.tsx**
- Theme switcher UI component
- Integrates with useTheme hook
- Persists user preference to localStorage
- Smooth transition animations

### Custom Hooks

**useTheme.ts**
- Manages theme state (light/dark/system)
- Handles system preference detection
- Applies theme classes to document root
- Provides theme toggle functionality

### State Management

**useNoteStore.ts** (Zustand Store)
- Centralized note state management
- Actions:
  - `fetchNotes()` - Load all notes from API
  - `createNote()` - Create new note with optimistic update
  - `updateNote()` - Update existing note with debouncing
  - `deleteNote()` - Delete note with confirmation
  - `setActiveNote()` - Set currently editing note
- Selectors for efficient component re-renders
- Middleware for persistence and devtools integration

### API Integration

**api.ts**
- Centralized API client configuration
- Request/response interceptors
- Error handling and retry logic
- TypeScript interfaces for API responses
- Functions:
  - `getNotes()` - Fetch all notes
  - `getNote(id)` - Fetch single note
  - `createNote(data)` - Create new note
  - `updateNote(id, data)` - Update note
  - `deleteNote(id)` - Delete note

## Styling & Theme System

### TailwindCSS Configuration
- Custom color palette from @nicenote/tokens
- Extended spacing and typography scales
- Custom breakpoints for responsive design
- Dark mode variant support

### Theme Generation
- **Script**: `scripts/generate-theme.ts`
- **Process**: Converts design tokens to CSS variables
- **Output**: Injected into `src/styles/theme.css`
- **Variables**: Color schemes, spacing, typography, shadows

### CSS Architecture
- **Global Styles**: Base styles in `index.css`
- **Component Styles**: Scoped with Tailwind utilities
- **Theme Variables**: CSS custom properties for dynamic theming
- **Utility Classes**: Extended Tailwind configuration

## State Management Strategy

### Zustand Store Structure
```typescript
interface NoteStore {
  // State
  notes: Note[];
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotes: () => Promise<void>;
  createNote: (data: CreateNoteData) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteData) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (id: string | null) => void;
}
```

### State Flow
1. User interaction triggers action
2. Optimistic UI update (if applicable)
3. API request dispatched
4. Success: State synchronized with server response
5. Error: Rollback optimistic update, show error message

## Development Workflow

### Development Commands
```bash
pnpm dev              # Start Vite dev server with HMR (http://localhost:5173)
pnpm build            # Production build with optimization
pnpm lint             # Run ESLint checks with auto-fix
pnpm preview          # Preview production build locally
pnpm generate:theme   # Generate theme CSS variables from tokens
pnpm type-check       # TypeScript type checking without emit
```

### Development Server
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **Fast Refresh**: Preserves component state during updates
- **Error Overlay**: Detailed error messages in browser
- **API Proxy**: Configured to proxy API requests to backend

## API Integration Details

### Request Handling
- Base URL configuration for different environments
- Automatic JSON serialization/deserialization
- Request timeout configuration
- Retry logic for failed requests

### Error Handling
- Network error detection
- API error response parsing
- User-friendly error messages
- Fallback UI for error states

### Loading States
- Global loading indicator
- Skeleton screens for content loading
- Optimistic updates for better UX
- Debounced save operations

## Build & Deployment

### Production Build
- Tree-shaking for minimal bundle size
- Code splitting by route
- Asset optimization (images, fonts)
- CSS purging for unused styles
- Source maps for debugging

### Build Output
```
dist/
├── assets/
│   ├── index-[hash].js    # Main application bundle
│   ├── index-[hash].css   # Compiled styles
│   └── [asset]-[hash].*   # Optimized assets
└── index.html              # Entry HTML file
```

### Environment Variables
- `VITE_API_URL` - Backend API base URL
- `VITE_APP_TITLE` - Application title
- Development/production environment detection

## Performance Optimizations

### Code Optimization
- Lazy loading for routes and heavy components
- Memoization with `useMemo` and `useCallback`
- Virtualization for long lists
- Debounced search and auto-save

### Asset Optimization
- Image lazy loading and compression
- Font subsetting and preloading
- Critical CSS inlining
- Service worker for caching (future)

### Bundle Optimization
- Dynamic imports for code splitting
- Vendor chunk separation
- Tree-shaking of unused code
- Minification and compression

## Accessibility

### ARIA Implementation
- Proper semantic HTML
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management

### Design Considerations
- Sufficient color contrast ratios
- Scalable font sizes
- Touch-friendly interactive elements
- Screen reader compatibility

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Hook testing with @testing-library/react-hooks
- Utility function testing

### Integration Testing
- API integration tests
- State management flow tests
- User interaction flows

### E2E Testing
- Critical user paths
- Cross-browser compatibility
- Responsive design validation

## Future Enhancements

### Planned Features
- Offline support with service workers
- Real-time collaboration with WebSockets
- Advanced search and filtering
- Note tagging and categorization
- Export functionality (PDF, Markdown)
- Sharing and permissions

### Technical Improvements
- Performance monitoring integration
- A/B testing infrastructure
- Progressive Web App (PWA) capabilities
- Enhanced error tracking and analytics
- Internationalization (i18n) support

## Integration with Internal Packages

### @nicenote/editor
- Rich text editing component
- Tiptap integration
- Custom extensions and plugins
- Toolbar configuration

### @nicenote/ui
- Reusable UI primitives
- Consistent design language
- Accessible components
- Theme-aware styling

### @nicenote/tokens
- Design token system
- Color palettes
- Typography scales
- Spacing system

## Best Practices

### Code Organization
- Component co-location
- Clear separation of concerns
- Consistent naming conventions
- TypeScript strict mode

### Performance
- Avoid unnecessary re-renders
- Optimize bundle size
- Lazy load non-critical code
- Cache API responses

### Security
- Input sanitization
- XSS prevention
- CSRF protection
- Secure API communication