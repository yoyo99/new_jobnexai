import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
// Compatibilité avec les fichiers Nav.vue requis par Netlify
// Remarque : cette ligne ne sera pas utilisée par l'application React principale
const emptyPlugin = { name: 'empty-plugin' }

// Create plugins array with required plugins
const plugins = [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ]
    },
    manifest: {
      name: 'JobNexAI - AI-Powered Job Search',
      short_name: 'JobNexAI',
      description: 'AI-powered job search and application management platform',
      theme_color: '#1f2937',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ]
    }
  }),
  viteCompression({
    algorithm: 'gzip',
    ext: '.gz',
    threshold: 1024,
    deleteOriginFile: false
  }),
  viteCompression({
    algorithm: 'brotliCompress',
    ext: '.br',
    threshold: 1024,
    deleteOriginFile: false
  }),
]

// Conditionally add Sentry plugin only if auth token is available
if (process.env.VITE_SENTRY_AUTH_TOKEN) {
  plugins.push(
    sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      telemetry: false,
    })
  )
}

// Add bundle analyzer in development
// Note: rollup-plugin-visualizer is ESM-only, use `npm run build -- --analyze` separately
// if (process.env.ANALYZE) {
//   const { visualizer } = await import('rollup-plugin-visualizer')
//   plugins.push(
//     visualizer({
//       filename: 'dist/stats.html',
//       open: true,
//       gzipSize: true,
//       brotliSize: true,
//     })
//   )
// }

export default defineConfig({
  plugins,
  optimizeDeps: {
    include: [
      '@tanstack/react-virtual',
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  // Améliorer la résolution des modules
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.vue'],
    alias: {
      // Utiliser fileURLToPath pour ESM moderne
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'src': fileURLToPath(new URL('./src', import.meta.url))
    },
    // Activer ces options pour aider à la résolution des modules
    preserveSymlinks: true,
    mainFields: ['module', 'jsnext:main', 'jsnext', 'browser', 'main']
  },
  server: {
    // Assurer que le serveur de dev utilise le dossier public
    // et gère correctement les chemins
    fs: {
      strict: false,
    },
  },
  publicDir: 'public',
  build: {
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
    modulePreload: { polyfill: false },
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
    // Enhanced asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      // Exclure les modules problématiques pour Netlify
      external: ['pnpapi', 'node_modules', /^puppeteer($|\/.*$)/, /\.git\//],
      output: {
        // Enhanced chunk optimization for better performance
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // Supabase client
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase'
            }
            // AI services
            if (id.includes('openai') || id.includes('mistralai') || id.includes('langchain')) {
              return 'ai-services'
            }
            // Charts and visualization
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts'
            }
            // Stripe payments
            if (id.includes('stripe')) {
              return 'stripe'
            }
            // UI libraries
            if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('lucide')) {
              return 'ui-libs'
            }
            // Internationalization
            if (id.includes('i18next')) {
              return 'i18n'
            }
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animations'
            }
            // Utilities and other vendors
            return 'vendor'
          }
          
          // Application code chunks
          if (id.includes('/components/recruiter/')) {
            return 'recruiter'
          }
          if (id.includes('/components/freelance/')) {
            return 'freelance'
          }
          if (id.includes('/components/cv/')) {
            return 'cv-builder'
          }
          if (id.includes('/components/applications/')) {
            return 'applications'
          }
          if (id.includes('/components/chat/')) {
            return 'chat'
          }
        },
        // Optimize chunk size
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            return '[name].[hash].js'
          }
          return 'chunk-[hash].js'
        },
      },
    },
  },
})