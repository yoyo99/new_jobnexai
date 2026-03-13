/**
 * Configuration PostCSS pour Vite
 * Initialise correctement Tailwind CSS comme plugin PostCSS
 */

module.exports = {
  plugins: [
    require('tailwindcss')(),
    require('autoprefixer')(),
  ],
}