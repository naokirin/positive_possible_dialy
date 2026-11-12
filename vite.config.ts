import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Relative base keeps project Pages (and nested user-site paths) portable.
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'できたこと日記',
        short_name: 'できたこと',
        description: 'できたことだけを記録する、明るい振り返り日記',
        theme_color: '#7eb8a2',
        background_color: '#f4faf7',
        display: 'standalone',
        start_url: './',
        scope: './',
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
