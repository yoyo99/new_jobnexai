import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import viteCompression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'

// Compatibilité avec les fichiers Nav.vue requis par Netlify
// Remarque : cette ligne ne sera pas utilisée par l'application React principale
const emptyPlugin = { name: 'empty-plugin' }

// Create plugins array with required plugins
const plugins = [
  react(),
  viteCompression({
    algorithm: 'gzip',
    ext: '.gz',
  }),
  viteCompression({
    algorithm: 'brotliCompress',
    ext: '.br',
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

export default defineConfig({
  plugins,
  optimizeDeps: {
    include: ['@tanstack/react-virtual'],
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
  build: {
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext', // Set the build target to esnext to support top-level await
    modulePreload: { polyfill: false }, // Disable module preload polyfill for modern builds
    // Assurer que des fichiers spécifiques sont exclus du build
    outDir: 'dist',
    assetsDir: 'assets',
    // Ne pas copier les fichiers statiques qui ne sont pas nécessaires
    copyPublicDir: true,
    rollupOptions: {
      // Exclure les modules problématiques pour Netlify
      external: ['pnpapi', 'node_modules', /^puppeteer($|\/.*$)/, /\.git\//],
      output: {
        // Optimisation des chunks pour une meilleure performance
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          i18n: ['i18next', 'react-i18next'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
