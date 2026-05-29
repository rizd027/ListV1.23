// workbox-config.js — Dijalankan setelah `next build` via `npm run build`
// Script: workbox generateSW workbox-config.js

module.exports = {
  globDirectory: 'out/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,svg,gif,webp,ico,woff,woff2,ttf,eot,json}',
  ],
  globIgnores: [
    // Abaikan file workbox itu sendiri agar tidak loop
    'workbox-*.js',
    'sw.js',
    // Abaikan Next.js internals yang tidak perlu di-cache
    '_next/static/chunks/pages/_app*',
  ],
  swDest: 'out/sw.js',
  // Juga copy sw.js ke public/ agar Capacitor bisa menemukannya
  // (dilakukan via script post-build)

  // ── Strategi Runtime ──────────────────────────────────────
  runtimeCaching: [
    // Google Sheets API → NetworkFirst (prioritas data fresh, fallback cache)
    {
      urlPattern: /^https:\/\/script\.google\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 jam
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Google Fonts CSS → StaleWhileRevalidate
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // Google Fonts woff2 → CacheFirst (jarang berubah)
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Gambar lokal → CacheFirst
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // JS & CSS → StaleWhileRevalidate
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-css-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],

  // ── Offline Fallback ──────────────────────────────────────
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    /^\/_next\//,
    /\/api\//,
  ],

  // ── SW Config ────────────────────────────────────────────
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  sourcemap: false,
};
