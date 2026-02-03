# UI Package (@nicenote/ui) - Detailed Documentation

## Overview
The UI package is the project's universal component library, providing a comprehensive suite of reusable foundational components and utility functions. Built with modern design principles and accessibility standards at its core, it serves as the design system foundation for all applications in the monorepo.

## Tech Stack
- **Framework**: React 18/19 (peer dependency) - Component architecture
- **Component Primitives**: Radix UI - Unstyled, accessible component primitives
- **Positioning Engine**: Floating UI - Smart positioning for tooltips, popovers, dropdowns
- **Icons**: Lucide React - Consistent, customizable icon library
- **Styling Utilities**: 
  - clsx - Conditional className composition
  - tailwind-merge - Intelligent TailwindCSS class merging
- **Styling Framework**: TailwindCSS (peer dependency) - Utility-first CSS

## Directory Structure
```
packages/ui/
├── src/
│   ├── components/           # UI component library
│   │   ├── button/          # Button component with variants
│   │   ├── badge/           # Badge/Chip component
│   │   ├── card/            # Card container components
│   │   ├── tooltip/         # Tooltip with Floating UI
│   │   ├── popover/         # Non-modal popover component
│   │   ├── dropdown-menu/   # Dropdown menu with Radix
│   │   ├── dialog/          # Modal dialog component
│   │   ├── input/           # Text input component
│   │   ├── textarea/        # Multi-line text input
│   │   ├── label/           # Form label component
│   │   ├── checkbox/        # Checkbox input
│   │   ├── radio-group/     # Radio button group
│   │   ├── select/          # Select dropdown
│   │   ├── switch/          # Toggle switch
│   │   ├── tabs/            # Tab navigation
│   │   ├── separator/       # Visual divider
│   │   ├── skeleton/        # Loading placeholder
│   │   ├── alert/           # Alert/notification component
│   │   └── ...              # Additional components
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.ts           # Mobile device detection
│   │   ├── use-window-size.ts      # Window dimensions tracking
│   │   ├── use-is-breakpoint.ts    # Responsive breakpoint detection
│   │   ├── use-media-query.ts      # Generic media query hook
│   │   └── use-theme.ts            # Theme context hook
│   ├── styles/              # Shared styles and CSS
│   │   ├── globals.css      # Global component styles
│   │   └── variables.css    # CSS custom properties
│   ├── lib/                 # Utility functions
│   │   └── utils.ts         # cn() and other utilities
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared component types
│   └── index.ts             # Main export file for all components
├── package.json             # Package configuration
├── tsconfig.json            # TypeScript configuration
└── tailwind.config.ts       # TailwindCSS configuration
```

## Core Components

### Button
**Purpose**: Primary interactive element for user actions

**Variants**:
- `default` - Standard filled button
- `destructive` - For dangerous actions (delete, remove)
- `outline` - Outlined button for secondary actions
- `ghost` - Minimal button without border
- `link` - Text-only button styled as link

**Sizes**:
- `sm` - Small (compact interfaces)
- `default` - Standard size
- `lg` - Large (emphasis, CTAs)
- `icon` - Square button for icon-only usage

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean; // Polymorphic component support
}
```

**Usage**:
```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Save Changes
</Button>
```

---

### Badge
**Purpose**: Display tags, statuses, counts, and labels

**Variants**:
- `default` - Standard badge styling
- `secondary` - Subtle, secondary information
- `destructive` - Error or warning states
- `outline` - Outlined badge variant

**Use Cases**:
- Status indicators
- Tag labels
- Notification counts
- Category markers

**Props**:
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}
```

**Usage**:
```tsx
<Badge variant="secondary">Beta</Badge>
<Badge variant="destructive">3 Errors</Badge>
```

---

### Card
**Purpose**: Container for grouped, related content

**Sub-components**:
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Footer section (actions, metadata)

**Use Cases**:
- Content grouping
- Dashboard widgets
- Preview cards
- Settings panels

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### Tooltip
**Purpose**: Contextual help and additional information on hover

**Features**:
- Smart positioning with Floating UI
- Automatic overflow detection
- Configurable delay
- Keyboard accessible
- Portal rendering to avoid z-index issues

**Props**:
```typescript
interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  children: React.ReactElement;
}
```

**Usage**:
```tsx
<Tooltip content="Save your changes">
  <Button>Save</Button>
</Tooltip>
```

---

### Popover
**Purpose**: Non-modal overlay for secondary content

**Features**:
- Smart positioning with collision detection
- Click or hover trigger options
- Portal rendering
- Keyboard navigation (Esc to close)
- Focus trap when open

**Use Cases**:
- Date pickers
- Color pickers
- Advanced filters
- Settings menus

**Sub-components**:
- `Popover` - Root component
- `PopoverTrigger` - Trigger element
- `PopoverContent` - Content container

**Usage**:
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button>Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    {/* Popover content */}
  </PopoverContent>
</Popover>
```

---

### DropdownMenu
**Purpose**: Menu of actions or options

**Features**:
- Radix UI primitives for accessibility
- Keyboard navigation (arrow keys, Home/End)
- Nested submenus support
- Checkboxes and radio items
- Separators and labels

**Sub-components**:
- `DropdownMenu` - Root
- `DropdownMenuTrigger` - Trigger button
- `DropdownMenuContent` - Menu container
- `DropdownMenuItem` - Menu item
- `DropdownMenuCheckboxItem` - Checkbox item
- `DropdownMenuRadioItem` - Radio item
- `DropdownMenuSeparator` - Visual separator
- `DropdownMenuLabel` - Section label
- `DropdownMenuSub` - Submenu

**Usage**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} destructive>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Dialog
**Purpose**: Modal overlay for important interactions

**Features**:
- Focus trap inside modal
- Backdrop click to close (optional)
- Escape key to close
- Scroll locking on body
- Portal rendering
- Animated entrance/exit

**Sub-components**:
- `Dialog` - Root component
- `DialogTrigger` - Open trigger
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Title (required for a11y)
- `DialogDescription` - Description
- `DialogFooter` - Footer with actions
- `DialogClose` - Close button

**Usage**:
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Form Components

#### Input
**Purpose**: Single-line text input

**Features**:
- Native HTML input with styled wrapper
- Error state styling
- Icon support (prefix/suffix)
- Placeholder and label integration

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
```

#### Textarea
**Purpose**: Multi-line text input

**Features**:
- Auto-resize option
- Character count
- Max length support

#### Label
**Purpose**: Accessible form labels

**Features**:
- Automatic htmlFor association
- Required indicator
- Error state styling

**Usage**:
```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

---

### Additional Components

#### Checkbox
- Radix UI primitive
- Indeterminate state support
- Custom check icon

#### Radio Group
- Grouped radio buttons
- Keyboard navigation
- Single selection enforcement

#### Select
- Native select alternative
- Searchable options
- Multi-select support
- Virtual scrolling for large lists

#### Switch
- Toggle switch component
- iOS-style appearance
- Controlled/uncontrolled modes

#### Tabs
- Tab navigation component
- Keyboard accessible
- URL syncing option

#### Separator
- Visual divider
- Horizontal and vertical orientations

#### Skeleton
- Loading placeholder
- Pulse animation
- Customizable shapes

#### Alert
- Notification component
- Variant types (info, success, warning, error)
- Dismissible option

---

## Utility Functions

### cn() - Intelligent Class Name Merger
**Purpose**: Merge and deduplicate Tailwind CSS classes

**Implementation**:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Benefits**:
- Resolves TailwindCSS class conflicts (last wins)
- Handles conditional classes
- Removes falsy values
- Type-safe with ClassValue

**Usage**:
```tsx
// Conflicting classes are resolved
cn('px-2 py-1', 'px-4') // Result: 'py-1 px-4'

// Conditional classes
cn('base-class', {
  'active-class': isActive,
  'disabled-class': isDisabled
})

// Array support
cn(['class-1', 'class-2'], 'class-3')
```

---

## Custom Hooks

### useMobile
**Purpose**: Detect mobile devices for responsive behavior

**Implementation**:
```typescript
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
```

**Use Cases**:
- Conditional component rendering
- Touch vs. mouse interactions
- Mobile-specific features

---

### useWindowSize
**Purpose**: Track window dimensions

**Returns**:
```typescript
interface WindowSize {
  width: number;
  height: number;
}
```

**Use Cases**:
- Responsive layouts
- Canvas/chart sizing
- Dynamic calculations

---

### useIsBreakpoint
**Purpose**: Check if current viewport matches a breakpoint

**Usage**:
```typescript
const isLargeScreen = useIsBreakpoint('lg'); // >= 1024px
const isMediumOrLarger = useIsBreakpoint('md'); // >= 768px
```

**Breakpoints**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

### useMediaQuery
**Purpose**: Generic media query hook

**Usage**:
```typescript
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
const isPortrait = useMediaQuery('(orientation: portrait)');
```

---

## Design Principles

### 1. Accessibility First
**Implementation**:
- ARIA labels and roles on all interactive components
- Keyboard navigation support (Tab, Enter, Escape, Arrow keys)
- Focus management and visible focus indicators
- Screen reader announcements for state changes
- Semantic HTML elements
- Color contrast compliance (WCAG AA/AAA)

**Testing**:
- axe-core for automated accessibility testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

---

### 2. Customization & Composition
**Patterns**:
- Compound components for flexibility
- Polymorphic components with `asChild` prop
- CSS variable-based theming
- Tailwind class overrides
- Render prop patterns where appropriate

**Example**:
```tsx
// Polymorphic button as a link
<Button asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>
```

---

### 3. Consistency
**Standards**:
- Unified naming conventions
- Consistent prop APIs across components
- Shared spacing and sizing scales
- Standard interaction patterns
- Predictable component behavior

---

### 4. Performance
**Optimizations**:
- Minimal re-renders with React.memo
- Lazy loading for heavy components
- Virtual scrolling for long lists
- Debounced/throttled event handlers
- Code splitting at component level
- Tree-shakeable exports

---

## Responsive Design System

### Breakpoint Strategy
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};
```

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly target sizes (min 44x44px)
- Simplified layouts on small screens

### Component Responsiveness
```tsx
// Responsive button size
<Button 
  size="sm"           // Mobile
  className="md:size-default lg:size-lg"  // Larger screens
>
  Submit
</Button>
```

---

## Theme Integration

### CSS Variable System
Components consume design tokens via CSS variables:

```css
.button {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-radius: var(--radius);
}
```

### Theme Switching
```tsx
// Theme provider from @nicenote/tokens
<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### Dark Mode Support
All components automatically adapt to dark mode through CSS variables:
```css
:root {
  --color-background: white;
  --color-foreground: black;
}

.dark {
  --color-background: black;
  --color-foreground: white;
}
```

---

## Package Configuration

### Build Setup
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
    },
    "./styles": "./dist/styles.css"
  }
}
```

### Peer Dependencies
```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "tailwindcss": "^3.4.0"
}
```

---

## Development Workflow

### Commands
```bash
pnpm build          # Build package for production
pnpm dev            # Build in watch mode
pnpm lint           # ESLint checks
pnpm type-check     # TypeScript validation
pnpm storybook      # Component documentation (if configured)
```

### Component Development Checklist
- [ ] Implement component with TypeScript
- [ ] Add accessibility features (ARIA, keyboard)
- [ ] Create variants and sizes
- [ ] Write comprehensive prop types
- [ ] Add JSDoc documentation
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify responsive behavior
- [ ] Add usage examples
- [ ] Update exports in index.ts

---

## Usage Guidelines

### Installation
In monorepo packages:
```json
{
  "dependencies": {
    "@nicenote/ui": "workspace:*"
  }
}
```

### Importing Components
```typescript
// Individual imports (recommended for tree-shaking)
import { Button, Badge, Card } from '@nicenote/ui';

// Import styles
import '@nicenote/ui/styles';
```

### TailwindCSS Configuration
Extend Tailwind config to include UI package:
```typescript
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  // ... rest of config
}
```

---

## Component API Patterns

### Compound Components
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Render Props
```tsx
<DropdownMenu>
  {({ isOpen }) => (
    <>
      <DropdownMenuTrigger>
        Menu {isOpen && '▴'}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Items */}
      </DropdownMenuContent>
    </>
  )}
</DropdownMenu>
```

### Polymorphic Components
```tsx
// Render as button
<Button>Click me</Button>

// Render as anchor
<Button asChild>
  <a href="/link">Navigate</a>
</Button>
```

---

## Testing Strategy

### Unit Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Accessibility Testing
```typescript
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Accessible</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Best Practices

### Component Design
✅ **Do**:
- Keep components focused and single-purpose
- Use forwardRef for ref forwarding
- Provide sensible default props
- Support both controlled and uncontrolled modes
- Export prop types for consumer TypeScript support

❌ **Don't**:
- Create overly complex components
- Assume specific application state
- Hardcode colors or spacing (use design tokens)
- Ignore accessibility requirements

### Styling
✅ **Do**:
- Use Tailwind utilities for consistency
- Leverage CSS variables for themeable values
- Follow mobile-first responsive approach
- Test dark mode appearance

❌ **Don't**:
- Use inline styles except for dynamic values
- Create custom CSS classes unnecessarily
- Ignore responsive breakpoints

---

## Migration Guide

### From v1 to v2
- Update Button variant prop names
- Replace deprecated Card props
- Update Tooltip API to use new positioning

### Breaking Changes
Documented in CHANGELOG.md with migration paths

---

## Future Enhancements

### Planned Components
- Combobox (searchable select)
- Command palette
- Data table with sorting/filtering
- Toast notifications
- Progress indicators
- Breadcrumbs
- Pagination
- Avatar with fallback
- Accordion
- Collapsible

### Planned Features
- Storybook documentation
- Accessibility audit tool integration
- Automated visual regression testing
- Component playground
- Figma design kit sync
- Animation system with Framer Motion

---

## Contributing

### Adding New Components
1. Create component directory in `src/components/`
2. Implement component with TypeScript and accessibility
3. Add Radix UI primitive if applicable
4. Style with Tailwind utilities
5. Write comprehensive prop types and JSDoc
6. Export from `src/index.ts`
7. Add usage examples
8. Test accessibility (keyboard, screen reader, axe)
9. Update documentation

### Code Standards
- TypeScript strict mode
- Functional components with hooks
- Proper ref forwarding
- Comprehensive prop types
- JSDoc comments for public APIs
- ESLint and Prettier compliance