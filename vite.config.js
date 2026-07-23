import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default defineConfig({
  define: {
    // Disponibile oriunde în cod ca __APP_VERSION__ / __BUILD_TIME__ — utile
    // ca să confirmi rapid, din Setări, dacă telefonul chiar rulează ultima
    // versiune (fără să mai ghicești dacă PWA-ul instalat e cel vechi cache-uit).
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' = NU se actualizează silențios; îi lăsăm pe utilizator să decidă
      // când apasă "Actualizează acum" (vezi src/components/UpdatePrompt.jsx).
      registerType: 'prompt',

      // Înregistrăm Service Worker-ul manual, prin hook-ul React
      // (virtual:pwa-register/react) din UpdatePrompt.jsx. Dacă am lăsa
      // injectRegister pe valoarea implicită, pluginul ar injecta ȘI el un
      // <script> separat de auto-înregistrare în index.html -> înregistrare dublă.
      injectRegister: null,

      includeAssets: ['icon-192.png', 'icon-512.png'],

      manifest: {
        id: '/',
        name: 'Portofel',
        short_name: 'Portofel',
        description: 'Registru personal de bani',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f2019',
        theme_color: '#1b3328',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },

      workbox: {
        // Curăță automat cache-urile din build-urile vechi la fiecare activare
        // a unui Service Worker nou — fără asta, fișierele vechi ar putea rămâne
        // "agățate" în cache după un deploy nou.
        cleanupOutdatedCaches: true,
        // Noul SW preia controlul imediat după activare (fără să aștepte
        // închiderea tuturor tab-urilor vechi).
        clientsClaim: true,
        // Fallback pentru navigare offline — servește index.html din cache
        // pentru orice rută necunoscută (necesar pt. React Router + offline).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Cache runtime pentru fonturile Google (folosite din CDN, nu din build)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 20 },
            },
          },
        ],
      },

      // Permite testarea PWA local, în `npm run dev` (nu doar în build de producție)
      devOptions: {
        enabled: false,
      },
    })
  ]
});
