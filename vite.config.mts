import { defineConfig, loadEnv } from 'vite'
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    publicDir: 'public',
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(env.VITE_STRIPE_PUBLIC_KEY),
      'process.env.VITE_MISTRAL_API_KEY': JSON.stringify(env.VITE_MISTRAL_API_KEY),
    },
    plugins,
    optimizeDeps: {
      include: ['@tanstack/react-virtual'],
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.vue'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'src': fileURLToPath(new URL('./src', import.meta.url))
      },
      preserveSymlinks: true,
      mainFields: ['module', 'jsnext:main', 'jsnext', 'browser', 'main']
    },
    build: {
      emptyOutDir: true,
      sourcemap: true,
      target: 'esnext',
      modulePreload: { polyfill: false },
      outDir: 'dist',
      assetsDir: 'assets',
      copyPublicDir: true,
      rollupOptions: {
        external: ['pnpapi', 'node_modules', /^puppeteer($|\/.*$)/, /\.git\//],
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@headlessui/react', '@heroicons/react'],
            i18n: ['i18next', 'react-i18next'],
            motion: ['framer-motion'],
          },
        },
      },
    }
  }
})
