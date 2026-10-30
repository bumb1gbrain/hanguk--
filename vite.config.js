import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '한국 형범 · เรียนเกาหลีกับเสือน้อย',
        short_name: '형범',
        description: 'เรียนภาษาเกาหลีจากกิจวัตรประจำวัน พร้อมตัวละครพิกเซลที่เติบโตไปกับคุณ',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1d1a2f',
        theme_color: '#1d1a2f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // ถ้าสร้างคลิปเดิมใหม่ (ชื่อไฟล์ไม่เปลี่ยน) ต้องเปลี่ยนเลข cacheName ด้านล่าง ไม่งั้นผู้เล่นเดิมยังได้เสียงเก่า
        // ไฟล์เสียงพากย์: แคชเมื่อเคยเล่นแล้ว (เล่นซ้ำ/ออฟไลน์ได้ทันที) รองรับ Range request ของ Safari
        runtimeCaching: [
          { urlPattern: /\/voice\/[^/]+\.m4a$/, handler: 'CacheFirst', options: { cacheName: 'voice-clips-v2', expiration: { maxEntries: 2500 }, cacheableResponse: { statuses: [0, 200] }, rangeRequests: true } },
          { urlPattern: /\/voice\/manifest\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'voice-manifest' } },
        ]
      }
    })
  ]
})
