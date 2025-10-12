import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Home Security App',
        short_name: 'SecurityApp',
        description: 'AI-powered home security monitoring',
        theme_color: '#1f2937',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: "data:image/svg+xml,<svg width='192' height='192' xmlns='http://www.w3.org/2000/svg'><rect width='192' height='192' fill='%231f2937'/><circle cx='96' cy='96' r='60' fill='%233b82f6'/><text x='96' y='110' font-family='Arial' font-size='48' fill='white' text-anchor='middle'>🛡️</text></svg>",
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: "data:image/svg+xml,<svg width='512' height='512' xmlns='http://www.w3.org/2000/svg'><rect width='512' height='512' fill='%231f2937'/><circle cx='256' cy='256' r='160' fill='%233b82f6'/><text x='256' y='280' font-family='Arial' font-size='128' fill='white' text-anchor='middle'>🛡️</text></svg>",
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  },
  build: {
    target: 'es2020',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgl']
  }
})