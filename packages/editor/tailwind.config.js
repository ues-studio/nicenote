/* eslint-env node */
/* global module, require */
/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  corePlugins: {
    preflight: false, // 禁用基础重置，保护编辑器核心样式
  },
  important: '.editor-wrapper',
  content: ['./src/components/**/*.{ts,tsx}', './src/index.tsx'],
  theme: {
    extend: {
      // 可以在此针对编辑器进行特殊的 Typography 配置
      typography: () => ({
        DEFAULT: {
          css: {
            color: 'var(--tt-theme-text)',
            fontSize: '16px',
            lineHeight: '1.6',
            '::selection': {
              backgroundColor: 'var(--tt-selection-color)',
            },
            '.ProseMirror-selectednode:not(img):not(pre):not(.react-renderer)': {
              borderRadius: 'var(--tt-radius-md)',
              backgroundColor: 'var(--tt-selection-color)',
            },
            '.is-empty:first-child[data-placeholder]::before': {
              content: 'attr(data-placeholder)',
              pointerEvents: 'none',
              height: '0',
              position: 'absolute',
              width: '100%',
              textAlign: 'inherit',
              left: '0',
              right: '0',
              color: 'var(--placeholder-color)',
            },
            p: {
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
              lineHeight: '1.6',
              '&:first-child': { marginTop: '0' },
              '&:last-child': { marginBottom: '0' },
            },
            a: {
              color: 'var(--link-text-color)',
              textDecoration: 'underline',
              '&:hover': {
                color: 'var(--tt-brand-color-600)',
              },
              '& span': { textDecoration: 'underline' },
            },
            img: {
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              marginTop: '2rem',
              marginBottom: '2rem',
              '&.ProseMirror-selectednode': {
                outline: '0.125rem solid var(--tt-brand-color-500)',
                borderRadius: 'var(--tt-radius-xs, 0.25rem)',
              },
            },
            '[data-type="emoji"] img': {
              display: 'inline-block',
              width: '1.25em',
              height: '1.25em',
              margin: '0',
              verticalAlign: 'middle',
            },
            '[data-type="mention"]': {
              display: 'inline-block',
              color: 'var(--tt-brand-color-500)',
            },
            h1: {
              color: 'var(--tt-theme-text)',
              fontSize: '1.5em',
              fontWeight: '700',
              marginTop: '3em',
              marginBottom: '1em',
              position: 'relative',
            },
            h2: {
              color: 'var(--tt-theme-text)',
              fontSize: '1.25em',
              fontWeight: '700',
              marginTop: '2.5em',
              marginBottom: '1em',
              position: 'relative',
            },
            h3: {
              color: 'var(--tt-theme-text)',
              fontSize: '1.125em',
              fontWeight: '600',
              marginTop: '2em',
              marginBottom: '1em',
              position: 'relative',
            },
            h4: {
              color: 'var(--tt-theme-text)',
              fontSize: '1em',
              fontWeight: '600',
              marginTop: '2em',
              marginBottom: '1em',
              position: 'relative',
            },
            pre: {
              background: 'var(--black)',
              borderRadius: '0.5rem',
              color: 'var(--white)',
              fontFamily: 'var(--font-mono)',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              '& code': {
                background: 'none',
                color: 'inherit',
                fontSize: '0.8rem',
                padding: '0',
              },
              '.hljs-comment, .hljs-quote': { color: '#616161' },
              '.hljs-variable, .hljs-template-variable, .hljs-attribute, .hljs-tag, .hljs-name, .hljs-regexp, .hljs-link, .hljs-selector-id, .hljs-selector-class':
                { color: '#f98181' },
              '.hljs-number, .hljs-meta, .hljs-built_in, .hljs-builtin-name, .hljs-literal, .hljs-type, .hljs-params':
                { color: '#fbbc88' },
              '.hljs-string, .hljs-symbol, .hljs-bullet': { color: '#b9f18d' },
              '.hljs-title, .hljs-section': { color: '#faf594' },
              '.hljs-keyword, .hljs-selector-tag': { color: '#70cff8' },
              '.hljs-emphasis': { fontStyle: 'italic' },
              '.hljs-strong': { fontWeight: '700' },
            },
            blockquote: {
              borderLeftWidth: '0.25em',
              borderLeftColor: 'var(--tt-gray-light-900)',
              color: 'var(--tt-gray-light-a-700)',
              fontStyle: 'normal',
              quotes: 'none',
              paddingLeft: '1em',
              paddingTop: '0.375em',
              paddingBottom: '0.375em',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              '& p:first-of-type::before': { content: 'none' },
              '& p:last-of-type::after': { content: 'none' },
            },
            code: {
              color: 'var(--tt-brand-color-900)',
              backgroundColor: 'var(--tt-brand-color-50)',
              padding: '0.25rem 0.4rem',
              borderRadius: '0.4rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            ol: {
              listStyleType: 'decimal',
              marginTop: '1.5em',
              marginBottom: '1.5em',
              paddingLeft: '1.5em',
              '& ol': { listStyleType: 'lower-alpha', marginTop: '0', marginBottom: '0' },
              '& ol ol': { listStyleType: 'lower-roman' },
              '& ul': { marginTop: '0', marginBottom: '0' },
            },
            ul: {
              listStyleType: 'disc',
              marginTop: '1.5em',
              marginBottom: '1.5em',
              paddingLeft: '1.5em',
              '& ul': { listStyleType: 'circle', marginTop: '0', marginBottom: '0' },
              '& ul ul': { listStyleType: 'square' },
              '& ol': { marginTop: '0', marginBottom: '0' },
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
              '& p': { marginTop: '0', marginBottom: '0', lineHeight: '1.6' },
            },
            hr: {
              borderColor: 'var(--tt-gray-light-a-200)',
              marginTop: '2.25em',
              marginBottom: '2.25em',
            },
          },
        },
        invert: {
          css: {
            hr: {
              borderColor: 'var(--tt-gray-dark-a-200)',
            },
            blockquote: {
              borderLeftColor: 'var(--tt-gray-dark-900)',
              color: 'var(--tt-gray-dark-a-700)',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
