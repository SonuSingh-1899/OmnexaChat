import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Union.png'],
      manifest: {
        name: 'Omnexa Chat',
        short_name: 'Omnexa',
        description: 'This is a real time chat app built by Sonu',
        theme_color: '#f5f5f5',
        background_color: '#f5f5f5',
        display: 'standalone',
        icons: [
          {
            src: '/Union.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/Union.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  define: {
    global: 'globalThis',
  },
})