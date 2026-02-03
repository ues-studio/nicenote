# Editor Package (@nicenote/editor) - Detailed Documentation

## Overview
The Editor package is a standalone rich text editor component library built on Tiptap, providing powerful editing capabilities for the note-taking application. It offers a feature-rich, extensible editing experience with a modern UI and comprehensive formatting options.

## Tech Stack
- **Core Engine**: Tiptap v3 (built on ProseMirror) - Powerful headless editor framework
- **Framework**: React (peer dependency) - Component-based architecture
- **UI Components**: @nicenote/ui - Internal design system components
- **Icons**: Lucide React - Consistent, customizable iconography
- **Utilities**: 
  - lodash.throttle - Performance optimization for frequent operations
  - lowlight - Syntax highlighting for code blocks
  - react-hotkeys-hook - Keyboard shortcut management
- **Positioning**: @floating-ui/react - Intelligent tooltip and popover positioning
- **Menus**: 
  - @radix-ui/react-dropdown-menu - Accessible dropdown menus
  - @radix-ui/react-popover - Accessible popovers

## Directory Structure
```
packages/editor/
├── src/
│   ├── components/           # Editor UI components
│   │   ├── tiptap-ui/       # Tiptap-specific UI components
│   │   │   ├── mark-button/ # Text formatting buttons (bold, italic, etc.)
│   │   │   ├── list-button/ # List operation buttons
│   │   │   ├── text-align-button/ # Text alignment controls
│   │   │   ├── horizontal-rule-button/ # Horizontal divider insertion
│   │   │   └── table-of-contents/ # Dynamic table of contents component
│   │   ├── toolbar/         # Editor toolbar with formatting controls
│   │   ├── source-editor/   # Raw HTML/Markdown source view
│   │   └── editor-wrapper/  # Main editor wrapper component
│   ├── extensions/          # Custom Tiptap extensions
│   │   └── placeholder/     # Custom placeholder extension
│   ├── hooks/               # Custom React hooks
│   │   └── use-mobile.ts    # Mobile device detection hook
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Editor-related interfaces and types
│   ├── utils/               # Utility functions
│   │   └── index.ts         # Exported utility functions
│   ├── styles/              # Styling files
│   │   └── editor.css       # Editor-specific styles
│   └── index.tsx            # Main package entry point
├── package.json             # Package configuration and dependencies
└── tsconfig.json            # TypeScript configuration
```

## Core Features

### Text Formatting
- **Basic Marks**: Bold, Italic, Underline, Strikethrough
- **Advanced Marks**: Highlight with color picker, Text color
- **Code**: Inline code and code blocks with syntax highlighting
- **Subscript/Superscript**: Scientific notation and mathematical expressions

### Structure & Organization
- **Lists**: Ordered lists, Unordered lists, Task lists with checkboxes
- **Alignment**: Left, Center, Right, Justify
- **Dividers**: Horizontal rules for content separation
- **Table of Contents**: Auto-generated navigation from headings

### Media & Embeds
- **Images**: Insert, resize, and manage images
- **Code Blocks**: Syntax-highlighted code with language detection
- **Links**: URL insertion and management

### Editing Experience
- **Keyboard Shortcuts**: Comprehensive hotkey support for all operations
- **Markdown Support**: Write in Markdown, render as formatted text
- **Auto-save**: Automatic content persistence (when integrated)
- **History**: Undo/Redo functionality
- **Drag & Drop**: Reorder content blocks

### Accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard control
- **Focus Management**: Proper focus indicators and trapping

## Tiptap Extensions

### Core Extensions
- **StarterKit**: Foundation bundle including Document, Paragraph, Text, Heading, Bold, Italic, etc.
- **Core**: Essential Tiptap functionality and base editor configuration

### Text Formatting
- **Highlight**: Text highlighting with customizable colors
- **TextStyle**: Inline text styling support
- **Color**: Text color customization
- **Underline**: Underline text decoration
- **Subscript/Superscript**: Scientific and mathematical notation

### Code & Syntax
- **CodeBlockLowlight**: Syntax-highlighted code blocks using lowlight
- **Code**: Inline code formatting
- **Languages**: Support for major programming languages

### Content Structure
- **Heading**: Multiple heading levels (H1-H6)
- **BulletList**: Unordered lists
- **OrderedList**: Numbered lists
- **TaskList**: Interactive checkboxes
- **ListItem**: List item wrapper
- **HorizontalRule**: Visual content separators

### Layout & Alignment
- **TextAlign**: Left, center, right, justify alignment
- **HardBreak**: Manual line breaks
- **Paragraph**: Standard text blocks

### Media
- **Image**: Image insertion with sizing and alignment
- **Link**: Hyperlink creation and editing

### Custom Extensions
- **Placeholder**: Custom placeholder text with dynamic content
- **TableOfContents**: Automatic heading-based navigation
- **Typography**: Smart quotes, em dashes, and other typographic improvements

### Utilities
- **History**: Undo/Redo functionality
- **Gapcursor**: Navigate between non-text elements
- **Dropcursor**: Visual indicator for drag & drop position

## Component Architecture

### EditorWrapper
**Purpose**: Main editor container and orchestrator

**Responsibilities**:
- Initializes Tiptap editor instance
- Manages editor configuration and extensions
- Handles external props and state synchronization
- Provides context for child components
- Manages editor lifecycle (mount, update, unmount)

**Props**:
- `content` - Initial or controlled content (JSON/HTML)
- `onUpdate` - Callback for content changes
- `editable` - Enable/disable editing mode
- `placeholder` - Placeholder text
- `className` - Additional CSS classes
- `extensions` - Additional custom extensions

### Toolbar
**Purpose**: Formatting controls and commands

**Features**:
- Collapsible on mobile devices
- Sticky positioning option
- Grouped buttons by category
- Active state indicators
- Keyboard shortcut hints

**Sections**:
- Text formatting (bold, italic, underline, etc.)
- Headings (H1-H6)
- Lists (bullet, ordered, task)
- Alignment controls
- Media insertion
- Advanced formatting

### Mark Buttons
**Components**: BoldButton, ItalicButton, UnderlineButton, StrikethroughButton, etc.

**Functionality**:
- Toggle text formatting marks
- Show active state when mark is applied
- Keyboard shortcut support
- Tooltip with shortcut hint

### List Buttons
**Components**: BulletListButton, OrderedListButton, TaskListButton

**Functionality**:
- Create and convert list types
- Increase/decrease indentation
- Split and merge list items

### Text Align Buttons
**Components**: AlignLeftButton, AlignCenterButton, AlignRightButton, AlignJustifyButton

**Functionality**:
- Set paragraph alignment
- Show active alignment state
- Support for RTL text

### Table of Contents
**Purpose**: Navigation sidebar for document structure

**Features**:
- Auto-generated from heading elements
- Click to scroll to section
- Collapsible nested structure
- Active section highlighting
- Responsive visibility (desktop only)

**Implementation**:
- Real-time updates as headings change
- Smooth scrolling to anchors
- Hierarchical nesting (H1 > H2 > H3)

### Source Editor
**Purpose**: Raw content editing view

**Features**:
- Toggle between visual and source mode
- Syntax highlighting for HTML/Markdown
- Real-time validation
- Two-way synchronization with visual editor

### Placeholder Extension
**Purpose**: Custom placeholder implementation

**Features**:
- Dynamic placeholder text based on context
- Styled placeholder appearance
- Automatic hide on content entry
- Customizable per-editor instance

## Responsive Design Strategy

### Desktop Experience (> 768px)
- Full toolbar with all formatting options
- Visible table of contents sidebar
- Expanded button labels and tooltips
- Multi-column layout support

### Tablet Experience (768px - 1024px)
- Condensed toolbar with icon-only buttons
- Collapsible table of contents
- Optimized touch targets
- Reduced spacing

### Mobile Experience (< 768px)
- Minimal toolbar with essential functions
- Hidden table of contents
- Bottom-sheet style menus
- Larger touch targets
- Simplified formatting options

### Adaptive Features
- Dynamic toolbar layout based on available width
- Progressive enhancement of features
- Touch-optimized interactions on mobile
- Keyboard-optimized on desktop

## State Management

### Editor State
**Managed by**: Tiptap Editor instance

**Contains**:
- Document content (ProseMirror document)
- Selection state (cursor position, text selection)
- Active marks and nodes
- Transaction history
- Plugin states

### Component State
**Managed by**: React component state

**Contains**:
- UI visibility toggles (toolbar, TOC)
- Modal and popover states
- Temporary form values (link URLs, image sources)
- Mobile/desktop view state

### External State Integration
**Communication with Parent**:
- `onUpdate` callback with JSON content
- Controlled vs. uncontrolled mode
- Ref forwarding for imperative control
- Event bubbling for custom actions

### Performance Optimizations
- Throttled update callbacks
- Memoized component renders
- Lazy-loaded heavy extensions
- Virtual scrolling for long documents

## Theme Integration

### Design Token Integration
- Consumes @nicenote/tokens for consistent theming
- CSS variables for dynamic theme switching
- Supports light and dark modes

### Theming Approach
```css
/* Editor uses CSS variables from tokens */
.editor {
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-default);
}

.editor-toolbar {
  background: var(--color-background-secondary);
}
```

### Custom Styling
- Editor-specific CSS in `styles/editor.css`
- ProseMirror-specific overrides
- Syntax highlighting themes
- Focus and selection styles

## Keyboard Shortcuts

### Text Formatting
- **Cmd/Ctrl + B** - Bold
- **Cmd/Ctrl + I** - Italic
- **Cmd/Ctrl + U** - Underline
- **Cmd/Ctrl + Shift + X** - Strikethrough
- **Cmd/Ctrl + E** - Inline code

### Structure
- **Cmd/Ctrl + Alt + 1-6** - Heading levels
- **Cmd/Ctrl + Shift + 8** - Bullet list
- **Cmd/Ctrl + Shift + 7** - Ordered list
- **Cmd/Ctrl + Shift + 9** - Task list

### Editing
- **Cmd/Ctrl + Z** - Undo
- **Cmd/Ctrl + Shift + Z** - Redo
- **Cmd/Ctrl + A** - Select all
- **Enter** - New paragraph
- **Shift + Enter** - Hard break

### Custom Shortcuts
- Configurable through extension options
- Platform-specific (Mac vs Windows/Linux)
- Context-aware (different shortcuts in code blocks)

## API & Props

### EditorWrapper Props
```typescript
interface EditorWrapperProps {
  content?: string | JSONContent;
  onUpdate?: (content: JSONContent) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  extensions?: Extension[];
  showTableOfContents?: boolean;
  showToolbar?: boolean;
  autoFocus?: boolean;
  minHeight?: string;
}
```

### Editor Instance Methods
```typescript
interface EditorInstance {
  // Content
  getHTML(): string;
  getJSON(): JSONContent;
  getText(): string;
  
  // Commands
  setContent(content: Content): void;
  insertContent(content: Content): void;
  clearContent(): void;
  
  // Focus
  focus(): void;
  blur(): void;
  
  // State
  isEmpty: boolean;
  isFocused: boolean;
  isEditable: boolean;
}
```

## Development Workflow

### Build Commands
```bash
pnpm build           # Build package for production
pnpm dev             # Build in watch mode
pnpm lint            # Run ESLint checks
pnpm type-check      # TypeScript type validation
```

### Package Configuration
- **Build Tool**: tsup for fast TypeScript bundling
- **Output Formats**: ESM and CommonJS
- **Type Definitions**: Generated .d.ts files
- **Exports**: Package.json exports field for optimal tree-shaking

### Peer Dependencies
```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

## Testing Strategy

### Unit Tests
- Component rendering tests
- Extension functionality tests
- Utility function tests
- Custom hook behavior

### Integration Tests
- Editor initialization
- Content updates and synchronization
- Toolbar interactions
- Extension interactions

### E2E Tests
- Complete editing workflows
- Keyboard shortcut sequences
- Mobile vs desktop behavior
- Theme switching

## Best Practices

### Performance
- Use throttle for frequent updates
- Memoize heavy computations
- Lazy load syntax highlighting languages
- Optimize re-renders with React.memo

### Accessibility
- Proper ARIA labels on all buttons
- Keyboard navigation for all features
- Screen reader announcements for state changes
- Focus management in modals and menus

### Extension Development
- Follow Tiptap extension API guidelines
- Provide TypeScript types
- Document extension options
- Test across browsers

### Code Quality
- Strict TypeScript mode
- ESLint with recommended rules
- Consistent naming conventions
- Comprehensive inline documentation

## Advanced Features

### Content Collaboration (Future)
- Real-time collaborative editing with Y.js
- Conflict resolution
- User presence indicators
- Comment threads

### Custom Extensions
- Easy to add via extensions prop
- Full access to ProseMirror API
- Custom node and mark types
- Plugin system integration

### Export Capabilities
- Export to Markdown
- Export to HTML
- Export to PDF
- Copy formatted text to clipboard

## Package Distribution

### Installation
```bash
pnpm add @nicenote/editor
```

### Import
```typescript
import { EditorWrapper } from '@nicenote/editor';
import '@nicenote/editor/dist/styles.css';
```

### Version Management
- Semantic versioning
- Changelog maintenance
- Breaking change documentation
- Migration guides

## Troubleshooting

### Common Issues
- **Styles not loading**: Ensure CSS import
- **Extensions not working**: Check peer dependency versions
- **Performance issues**: Review update callback frequency
- **Mobile rendering**: Verify responsive hooks

### Debug Mode
- Enable Tiptap devtools
- Console logging for state changes
- React DevTools integration
- ProseMirror inspector

## Future Roadmap

### Planned Features
- Collaborative editing with WebRTC
- Advanced table support
- Diagram and chart insertion
- Math equation editor
- Voice-to-text integration
- AI-powered writing assistance

### Technical Improvements
- Virtual scrolling for large documents
- Web Worker for heavy computations
- IndexedDB for local caching
- Progressive enhancement strategy