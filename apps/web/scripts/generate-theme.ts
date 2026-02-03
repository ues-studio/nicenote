/**
 * Generate Tailwind CSS theme variables from tokens package
 * Run this script when colors.ts is updated
 */
import { colors, darkColors } from '@nicenote/tokens'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const generateThemeCSS = () => {
  const cssVars: string[] = []

  // Add header
  cssVars.push('@theme {')
  cssVars.push('  /* Auto-generated from @nicenote/tokens */')
  cssVars.push('')

  // Primary colors
  cssVars.push('  /* Primary colors */')
  cssVars.push(`  --color-primary: ${colors.primary};`)
  cssVars.push(`  --color-primary-hover: ${colors.primaryHover};`)
  cssVars.push(`  --color-primary-active: ${colors.primaryActive};`)
  cssVars.push(`  --color-primary-focus: ${colors.primaryFocus};`)
  cssVars.push(`  --color-primary-disabled: ${colors.primaryDisabled};`)
  cssVars.push(`  --color-primary-text: ${colors.primaryText};`)
  cssVars.push(`  --color-primary-bg: ${colors.primaryBg};`)
  cssVars.push(`  --color-primary-foreground: ${colors.textInverse};`)
  cssVars.push('')

  // Secondary colors
  cssVars.push('  /* Secondary colors */')
  cssVars.push(`  --color-secondary: ${colors.secondary};`)
  cssVars.push(`  --color-secondary-hover: ${colors.secondaryHover};`)
  cssVars.push(`  --color-secondary-active: ${colors.secondaryActive};`)
  cssVars.push(`  --color-secondary-disabled: ${colors.secondaryDisabled};`)
  cssVars.push(`  --color-secondary-text: ${colors.secondaryText};`)
  cssVars.push(`  --color-secondary-bg: ${colors.secondaryBg};`)
  cssVars.push(`  --color-secondary-foreground: ${colors.textPrimary};`)
  cssVars.push('')

  // Background and foreground
  cssVars.push('  /* Background and foreground */')
  cssVars.push(`  --color-background: ${colors.bgBase};`)
  cssVars.push(`  --color-foreground: ${colors.textPrimary};`)
  cssVars.push('')

  // Muted
  cssVars.push('  /* Muted */')
  cssVars.push(`  --color-muted: ${colors.bgMuted};`)
  cssVars.push(`  --color-muted-foreground: ${colors.textSecondary};`)
  cssVars.push('')

  // Border
  cssVars.push('  /* Border */')
  cssVars.push(`  --color-border: ${colors.border};`)
  cssVars.push(`  --color-ring: ${colors.borderFocus};`)
  cssVars.push('')

  // Accent
  cssVars.push('  /* Accent */')
  cssVars.push(`  --color-accent: ${colors.bgHover};`)
  cssVars.push(`  --color-accent-foreground: ${colors.primaryText};`)
  cssVars.push('')

  // Active state
  cssVars.push('  /* Active state */')
  cssVars.push(`  --color-active: ${colors.bgActive};`)
  cssVars.push(`  --color-active-foreground: ${colors.primaryText};`)
  cssVars.push('')

  // Hover state
  cssVars.push('  /* Hover state */')
  cssVars.push(`  --color-hover: ${colors.bgHover};`)
  cssVars.push(`  --color-hover-foreground: ${colors.primaryText};`)
  cssVars.push('')

  // Destructive
  cssVars.push('  /* Destructive */')
  cssVars.push(`  --color-destructive: ${colors.error};`)
  cssVars.push(`  --color-destructive-hover: ${colors.errorHover};`)
  cssVars.push(`  --color-destructive-foreground: ${colors.textInverse};`)
  cssVars.push(`  --color-destructive-text: ${colors.errorText};`)
  cssVars.push(`  --color-destructive-bg: ${colors.errorBg};`)
  cssVars.push(`  --color-destructive-border: ${colors.errorBorder};`)
  cssVars.push('')

  // Success
  cssVars.push('  /* Success */')
  cssVars.push(`  --color-success: ${colors.success};`)
  cssVars.push(`  --color-success-hover: ${colors.successHover};`)
  cssVars.push(`  --color-success-text: ${colors.successText};`)
  cssVars.push(`  --color-success-bg: ${colors.successBg};`)
  cssVars.push(`  --color-success-border: ${colors.successBorder};`)
  cssVars.push('')

  // Warning
  cssVars.push('  /* Warning */')
  cssVars.push(`  --color-warning: ${colors.warning};`)
  cssVars.push(`  --color-warning-hover: ${colors.warningHover};`)
  cssVars.push(`  --color-warning-text: ${colors.warningText};`)
  cssVars.push(`  --color-warning-bg: ${colors.warningBg};`)
  cssVars.push(`  --color-warning-border: ${colors.warningBorder};`)
  cssVars.push('')

  // Info
  cssVars.push('  /* Info */')
  cssVars.push(`  --color-info: ${colors.info};`)
  cssVars.push(`  --color-info-hover: ${colors.infoHover};`)
  cssVars.push(`  --color-info-text: ${colors.infoText};`)
  cssVars.push(`  --color-info-bg: ${colors.infoBg};`)
  cssVars.push(`  --color-info-border: ${colors.infoBorder};`)
  cssVars.push('')

  // Popover
  cssVars.push('  /* Popover */')
  cssVars.push(`  --color-popover: ${colors.bgBase};`)
  cssVars.push(`  --color-popover-foreground: ${colors.textPrimary};`)
  cssVars.push('')

  // Card
  cssVars.push('  /* Card */')
  cssVars.push(`  --color-card: ${colors.bgBase};`)
  cssVars.push(`  --color-card-foreground: ${colors.textPrimary};`)

  cssVars.push('}')

  return cssVars.join('\n')
}

const generateDarkThemeCSS = () => {
  const cssVars: string[] = []

  // Add dark mode header - only use .dark class for manual toggle
  cssVars.push('')
  cssVars.push('/* Dark mode */')
  cssVars.push('.dark {')

  // Primary colors
  cssVars.push('  /* Primary colors */')
  cssVars.push(`  --color-primary: ${darkColors.primary};`)
  cssVars.push(`  --color-primary-hover: ${darkColors.primaryHover};`)
  cssVars.push(`  --color-primary-active: ${darkColors.primaryActive};`)
  cssVars.push(`  --color-primary-focus: ${darkColors.primaryFocus};`)
  cssVars.push(`  --color-primary-disabled: ${darkColors.primaryDisabled};`)
  cssVars.push(`  --color-primary-text: ${darkColors.primaryText};`)
  cssVars.push(`  --color-primary-bg: ${darkColors.primaryBg};`)
  cssVars.push(`  --color-primary-foreground: ${darkColors.textInverse};`)
  cssVars.push('')

  // Secondary colors
  cssVars.push('  /* Secondary colors */')
  cssVars.push(`  --color-secondary: ${darkColors.secondary};`)
  cssVars.push(`  --color-secondary-hover: ${darkColors.secondaryHover};`)
  cssVars.push(`  --color-secondary-active: ${darkColors.secondaryActive};`)
  cssVars.push(`  --color-secondary-disabled: ${darkColors.secondaryDisabled};`)
  cssVars.push(`  --color-secondary-text: ${darkColors.secondaryText};`)
  cssVars.push(`  --color-secondary-bg: ${darkColors.secondaryBg};`)
  cssVars.push(`  --color-secondary-foreground: ${darkColors.textPrimary};`)
  cssVars.push('')

  // Background and foreground
  cssVars.push('  /* Background and foreground */')
  cssVars.push(`  --color-background: ${darkColors.bgBase};`)
  cssVars.push(`  --color-foreground: ${darkColors.textPrimary};`)
  cssVars.push('')

  // Muted
  cssVars.push('  /* Muted */')
  cssVars.push(`  --color-muted: ${darkColors.bgMuted};`)
  cssVars.push(`  --color-muted-foreground: ${darkColors.textSecondary};`)
  cssVars.push('')

  // Border
  cssVars.push('  /* Border */')
  cssVars.push(`  --color-border: ${darkColors.border};`)
  cssVars.push(`  --color-ring: ${darkColors.borderFocus};`)
  cssVars.push('')

  // Accent
  cssVars.push('  /* Accent */')
  cssVars.push(`  --color-accent: ${darkColors.bgHover};`)
  cssVars.push(`  --color-accent-foreground: ${darkColors.primaryText};`)
  cssVars.push('')

  // Active state
  cssVars.push('  /* Active state */')
  cssVars.push(`  --color-active: ${darkColors.bgActive};`)
  cssVars.push(`  --color-active-foreground: ${darkColors.primaryText};`)
  cssVars.push('')

  // Hover state
  cssVars.push('  /* Hover state */')
  cssVars.push(`  --color-hover: ${darkColors.bgHover};`)
  cssVars.push(`  --color-hover-foreground: ${darkColors.primaryText};`)
  cssVars.push('')

  // Destructive
  cssVars.push('  /* Destructive */')
  cssVars.push(`  --color-destructive: ${darkColors.error};`)
  cssVars.push(`  --color-destructive-hover: ${darkColors.errorHover};`)
  cssVars.push(`  --color-destructive-foreground: ${darkColors.textInverse};`)
  cssVars.push(`  --color-destructive-text: ${darkColors.errorText};`)
  cssVars.push(`  --color-destructive-bg: ${darkColors.errorBg};`)
  cssVars.push(`  --color-destructive-border: ${darkColors.errorBorder};`)
  cssVars.push('')

  // Success
  cssVars.push('  /* Success */')
  cssVars.push(`  --color-success: ${darkColors.success};`)
  cssVars.push(`  --color-success-hover: ${darkColors.successHover};`)
  cssVars.push(`  --color-success-text: ${darkColors.successText};`)
  cssVars.push(`  --color-success-bg: ${darkColors.successBg};`)
  cssVars.push(`  --color-success-border: ${darkColors.successBorder};`)
  cssVars.push('')

  // Warning
  cssVars.push('  /* Warning */')
  cssVars.push(`  --color-warning: ${darkColors.warning};`)
  cssVars.push(`  --color-warning-hover: ${darkColors.warningHover};`)
  cssVars.push(`  --color-warning-text: ${darkColors.warningText};`)
  cssVars.push(`  --color-warning-bg: ${darkColors.warningBg};`)
  cssVars.push(`  --color-warning-border: ${darkColors.warningBorder};`)
  cssVars.push('')

  // Info
  cssVars.push('  /* Info */')
  cssVars.push(`  --color-info: ${darkColors.info};`)
  cssVars.push(`  --color-info-hover: ${darkColors.infoHover};`)
  cssVars.push(`  --color-info-text: ${darkColors.infoText};`)
  cssVars.push(`  --color-info-bg: ${darkColors.infoBg};`)
  cssVars.push(`  --color-info-border: ${darkColors.infoBorder};`)
  cssVars.push('')

  // Popover
  cssVars.push('  /* Popover */')
  cssVars.push(`  --color-popover: ${darkColors.bgBase};`)
  cssVars.push(`  --color-popover-foreground: ${darkColors.textPrimary};`)
  cssVars.push('')

  // Card
  cssVars.push('  /* Card */')
  cssVars.push(`  --color-card: ${darkColors.bgBase};`)
  cssVars.push(`  --color-card-foreground: ${darkColors.textPrimary};`)

  cssVars.push('}')

  return cssVars.join('\n')
}

// Generate theme CSS
const themeCSS = generateThemeCSS()
const darkThemeCSS = generateDarkThemeCSS()

// Read existing index.css
const indexCssPath = join(__dirname, '../src/index.css')
const indexCssContent = `@import 'tailwindcss';
@plugin "@tailwindcss/typography";
@source "../../packages/**/*.{ts,tsx}";
@config "../tailwind.config.ts";

/* Tiptap Simple Editor Required Styles */
@import '@nicenote/editor/src/styles/editor-styles.css';

${themeCSS}

${darkThemeCSS}

@layer base {
  /* Explicitly set CSS variables on :root for light mode */
  :root {
    --color-primary: ${colors.primary};
    --color-primary-hover: ${colors.primaryHover};
    --color-primary-active: ${colors.primaryActive};
    --color-primary-focus: ${colors.primaryFocus};
    --color-primary-disabled: ${colors.primaryDisabled};
    --color-primary-text: ${colors.primaryText};
    --color-primary-bg: ${colors.primaryBg};
    --color-primary-foreground: ${colors.textInverse};

    --color-secondary: ${colors.secondary};
    --color-secondary-hover: ${colors.secondaryHover};
    --color-secondary-active: ${colors.secondaryActive};
    --color-secondary-disabled: ${colors.secondaryDisabled};
    --color-secondary-text: ${colors.secondaryText};
    --color-secondary-bg: ${colors.secondaryBg};
    --color-secondary-foreground: ${colors.textPrimary};

    --color-background: ${colors.bgBase};
    --color-foreground: ${colors.textPrimary};

    --color-muted: ${colors.bgMuted};
    --color-muted-foreground: ${colors.textSecondary};

    --color-border: ${colors.border};
    --color-input: ${colors.border};
    --color-ring: ${colors.borderFocus};

    --color-accent: ${colors.bgHover};
    --color-accent-foreground: ${colors.primaryText};

    --color-active: ${colors.bgActive};
    --color-active-foreground: ${colors.primaryText};

    --color-hover: ${colors.bgHover};
    --color-hover-foreground: ${colors.primaryText};

    --color-destructive: ${colors.error};
    --color-destructive-hover: ${colors.errorHover};
    --color-destructive-foreground: ${colors.textInverse};
    --color-destructive-text: ${colors.errorText};
    --color-destructive-bg: ${colors.errorBg};
    --color-destructive-border: ${colors.errorBorder};

    --color-success: ${colors.success};
    --color-success-hover: ${colors.successHover};
    --color-success-text: ${colors.successText};
    --color-success-bg: ${colors.successBg};
    --color-success-border: ${colors.successBorder};

    --color-warning: ${colors.warning};
    --color-warning-hover: ${colors.warningHover};
    --color-warning-text: ${colors.warningText};
    --color-warning-bg: ${colors.warningBg};
    --color-warning-border: ${colors.warningBorder};

    --color-info: ${colors.info};
    --color-info-hover: ${colors.infoHover};
    --color-info-text: ${colors.infoText};
    --color-info-bg: ${colors.infoBg};
    --color-info-border: ${colors.infoBorder};

    --color-popover: ${colors.bgBase};
    --color-popover-foreground: ${colors.textPrimary};

    --color-card: ${colors.bgBase};
    --color-card-foreground: ${colors.textPrimary};
  }

  input,
  textarea,
  select {
    @apply border border-border rounded-md;
  }
  
  input:focus,
  textarea:focus,
  select:focus,
  button:focus {
    @apply focus:ring-1 focus:ring-ring focus:outline-none;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}
`

// Write to index.css
writeFileSync(indexCssPath, indexCssContent, 'utf-8')

console.log('✅ Theme CSS generated successfully in index.css')
