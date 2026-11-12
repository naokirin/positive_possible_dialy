import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const root = path.dirname(fileURLToPath(import.meta.url))
const pagesBase = '/positive_possible_dialy/'

export default defineConfig({
  // Absolute path: sibling PWAs on naokirin.github.io need distinct WebAPK id/scope.
  base: pagesBase,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: pagesBase,
        name: 'できたこと日記',
        short_name: 'できたこと',
        description: 'できたことだけを記録する、明るい振り返り日記',
        theme_color: '#7eb8a2',
        background_color: '#f4faf7',
        display: 'standalone',
        start_url: pagesBase,
        scope: pagesBase,
        lang: 'ja',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      $lib: path.resolve(root, 'src/lib'),
    },
  },
})
