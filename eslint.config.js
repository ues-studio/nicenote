import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 辅助函数：快速定位 tsconfig
 */
const getTsconfigPath = (path) => resolve(__dirname, path)

export default tseslint.config(
  // 1. 全局忽略配置
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/.turbo/**',
      '**/drizzle/**',
      '**/.wrangler/**',
      '**/*.d.ts',
      '!*.config.js',
      '!eslint.config.js',
    ],
  },

  // 2. 基础 JavaScript 配置
  js.configs.recommended,

  // 3. 基础 TypeScript 配置 (自动应用于 ts/tsx)
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 4. React 全局共享配置
  {
    files: ['**/*.tsx', '**/*.ts'], // 适当包含 .ts 以防工具函数用到 hooks
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },

  // 5. Web 应用特定配置 (apps/web)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: getTsconfigPath('apps/web'),
      },
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // 6. API 应用特定配置 (apps/api)
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: getTsconfigPath('apps/api'),
      },
    },
  },

  // API 入口文件特殊规则
  {
    files: ['apps/api/src/index.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // 7. Editor & UI 包特定配置
  {
    files: ['packages/editor/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    rules: {
      'react/prop-types': 'off', // 使用 TypeScript 类型，不需要 PropTypes
      'react-hooks/set-state-in-effect': 'off', // 允许在 effect 中同步调用 setState
      'react-hooks/refs': 'off', // 允许在 render 中访问 refs（某些场景需要）
      'react-hooks/immutability': 'off', // 允许修改 refs
    },
  },

  {
    files: ['packages/editor/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: getTsconfigPath('packages/editor'),
      },
    },
  },

  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: getTsconfigPath('packages/ui'),
      },
    },
  },

  // 8. Shared 包特定配置 (packages/shared)
  {
    files: ['packages/shared/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // deepClone 等工具函数需要使用 any
    },
  },

  // 9. Prettier 配置
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      ...prettierConfig.rules, // 关闭 ESLint 中与 Prettier 冲突的规则
    },
  }
)
