import { exec } from 'node:child_process'

import type { Plugin } from 'vite'

export function tokensHotReload(): Plugin {
  let pending: ReturnType<typeof setTimeout> | null = null

  return {
    name: 'nicenote:tokens-hot-reload',
    configureServer(server) {
      server.watcher.add('../../packages/tokens/src')
      server.watcher.on('change', (path) => {
        if (!path.includes('packages/tokens/src')) return
        if (pending) clearTimeout(pending)
        pending = setTimeout(() => {
          pending = null
          exec(
            'pnpm --filter @nicenote/tokens build && tsx scripts/generate-css.ts',
            { cwd: server.config.root },
            (err) => {
              if (err) {
                server.config.logger.error(`[tokens] rebuild failed: ${err.message}`)
              } else {
                server.config.logger.info('[tokens] rebuilt successfully')
              }
            }
          )
        }, 200)
      })
    },
  }
}
