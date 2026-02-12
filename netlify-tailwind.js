#!/usr/bin/env node

// Ensure Tailwind CSS is properly processed in Netlify builds
console.log('Configuring Tailwind CSS for Netlify build...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour créer un fichier de configuration Tailwind de secours si nécessaire
function createFallbackTailwindConfig() {
  const configPath = path.join(__dirname, 'tailwind.config.js');
  const fallbackConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [],
}`;

  fs.writeFileSync(configPath, fallbackConfig, 'utf8');
  console.log('✅ Created fallback tailwind.config.js');
}

// Fonction pour créer un fichier postcss.config.js de secours si nécessaire
function createFallbackPostcssConfig() {
  const configPath = path.join(__dirname, 'postcss.config.js');
  const fallbackConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  fs.writeFileSync(configPath, fallbackConfig, 'utf8');
  console.log('✅ Created fallback postcss.config.js');
}

// Vérifier si les dépendances nécessaires sont installées
function checkDependencies() {
  const dependencies = ['tailwindcss', 'postcss', 'autoprefixer', 'postcss-cli'];
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devDeps = packageJson.devDependencies || {};
    const deps = packageJson.dependencies || {};
    
    const missingDeps = dependencies.filter(dep => !devDeps[dep] && !deps[dep]);
    
    if (missingDeps.length > 0) {
      console.log(`⚠️ Missing dependencies: ${missingDeps.join(', ')}`);
      console.log('📦 Installing missing dependencies...');
      
      try {
        execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
        console.log('✅ Successfully installed missing dependencies');
      } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
      }
    } else {
      console.log('✅ All required dependencies are installed');
    }
  } else {
    console.error('❌ package.json not found');
  }
}

// Fonction principale
async function main() {
  try {
    // Vérifier les dépendances
    checkDependencies();
    
    // Vérifier tailwind.config.js
    const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');
    if (!fs.existsSync(tailwindConfigPath)) {
      console.log('⚠️ tailwind.config.js not found, creating fallback...');
      createFallbackTailwindConfig();
    } else {
      console.log('✅ tailwind.config.js exists');
      
      // Essayer de charger la configuration pour vérifier qu'elle est valide
      try {
        const tailwindConfig = require('./tailwind.config.js');
        console.log('✅ Successfully loaded tailwind.config.js');
      } catch (error) {
        console.error('❌ Error loading tailwind.config.js:', error.message);
        console.log('⚠️ Creating fallback tailwind.config.js...');
        createFallbackTailwindConfig();
      }
    }
    
    // Vérifier postcss.config.js
    const postcssConfigPath = path.join(__dirname, 'postcss.config.js');
    if (!fs.existsSync(postcssConfigPath)) {
      console.log('⚠️ postcss.config.js not found, creating fallback...');
      createFallbackPostcssConfig();
    } else {
      console.log('✅ postcss.config.js exists');
    }
    
    // Vérifier index.css
    const indexCssPath = path.join(__dirname, 'src', 'index.css');
    if (fs.existsSync(indexCssPath)) {
      const content = fs.readFileSync(indexCssPath, 'utf8');
      console.log('✅ Successfully loaded index.css');
      
      // Vérifier si les directives Tailwind sont présentes
      if (content.includes('@tailwind base') && 
          content.includes('@tailwind components') && 
          content.includes('@tailwind utilities')) {
        console.log('✅ Tailwind directives found in index.css');
      } else {
        console.log('⚠️ Warning: Tailwind directives not found in index.css');
        // Ajouter les directives si elles sont manquantes
        const updatedContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

${content}`;
        fs.writeFileSync(indexCssPath, updatedContent, 'utf8');
        console.log('✅ Added Tailwind directives to index.css');
      }
    } else {
      console.log('⚠️ Warning: index.css not found');
    }
    
    console.log('✅ Tailwind CSS configuration check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during Tailwind configuration setup:', error);
    process.exit(1);
  }
}

// Exécuter le script principal
main();
