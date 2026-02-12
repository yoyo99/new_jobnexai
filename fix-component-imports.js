#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les problèmes d'importation dans les composants React
 * Ce script:
 * 1. Convertit les imports par défaut en imports nommés lorsque nécessaire
 * 2. Corrige les imports lazy dans App.tsx
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}Démarrage de la correction automatique des imports...${colors.reset}`);

// Chemin de base du projet
const basePath = process.cwd();

// Liste des composants qui devraient utiliser des imports nommés
const componentsWithNamedExports = [
  'Hero',
  'Features',
  'HowItWorks',
  'Testimonials',
  'Footer',
  'LanguageSwitcher',
  'JobNexAILanding',
  // Ajoutez d'autres composants selon vos besoins
];

// Fonction pour corriger les imports dans un fichier
function fixImportsInFile(filePath, componentName) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Recherche des imports par défaut pour les convertir en imports nommés
    componentsWithNamedExports.forEach(component => {
      // Regex pour trouver les imports par défaut comme: import Component from './Component'
      const defaultImportRegex = new RegExp(`import\\s+${component}\\s+from\\s+['"]([^'"]+)['"]`, 'g');
      
      if (defaultImportRegex.test(content)) {
        content = content.replace(defaultImportRegex, `import { ${component} } from '$1'`);
        modified = true;
        console.log(`${colors.green}✓ Converti l'import par défaut en import nommé pour ${component} dans ${path.relative(basePath, filePath)}${colors.reset}`);
      }
    });
    
    // Correction spécifique pour les imports lazy dans App.tsx
    if (filePath.endsWith('App.tsx') || filePath.endsWith('App.jsx')) {
      // Regex pour trouver les imports lazy simples
      const lazyImportRegex = /const\s+(\w+)\s+=\s+lazy\(\(\)\s+=>\s+import\(['"]([^'"]+)['"]\)\)/g;
      
      content = content.replace(lazyImportRegex, (match, componentName, importPath) => {
        if (componentsWithNamedExports.includes(componentName)) {
          console.log(`${colors.green}✓ Corrigé l'import lazy pour ${componentName} dans App.tsx${colors.reset}`);
          return `const ${componentName} = lazy(() => 
  import('${importPath}').then(module => ({
    default: module.${componentName}
  }))
)`;
        }
        return match;
      });
      
      modified = true;
    }
    // Remplacer lazy par React.lazy s'il est utilisé directement
const directLazyRegex = /const\s+(\w+)\s+=\s+lazy\(\(/g;
if (directLazyRegex.test(content)) {
  content = content.replace(directLazyRegex, 'const $1 = React.lazy((');
  console.log(`${colors.green}✓ Remplacé lazy par React.lazy dans ${path.relative(basePath, filePath)}${colors.reset}`);
  modified = true;
}
    // Sauvegarde des modifications si le fichier a été modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`${colors.green}✓ Fichier sauvegardé: ${path.relative(basePath, filePath)}${colors.reset}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`${colors.red}✗ Erreur lors de la correction des imports dans ${filePath}:${colors.reset}`, error);
    return false;
  }
}

// Fonction pour corriger les exports dans un fichier
function fixExportsInFile(filePath, componentName) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Vérifier si le fichier exporte par défaut
    const defaultExportRegex = /export\s+default\s+(\w+)/g;
    const namedExportRegex = /export\s+const\s+(\w+)/g;
    
    // Si le composant est dans la liste des exports nommés mais utilise export default
    if (componentsWithNamedExports.includes(componentName) && defaultExportRegex.test(content)) {
      // Convertir export default Component en export const Component
      content = content.replace(defaultExportRegex, (match, exportName) => {
        if (exportName === componentName) {
          console.log(`${colors.green}✓ Converti l'export par défaut en export nommé pour ${componentName} dans ${path.relative(basePath, filePath)}${colors.reset}`);
          return `export const ${exportName}`;
        }
        return match;
      });
      
      modified = true;
    }
    
    // Sauvegarde des modifications si le fichier a été modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`${colors.green}✓ Fichier sauvegardé: ${path.relative(basePath, filePath)}${colors.reset}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`${colors.red}✗ Erreur lors de la correction des exports dans ${filePath}:${colors.reset}`, error);
    return false;
  }
}

// Fonction principale pour scanner et corriger les fichiers
async function main() {
  try {
    // Trouver tous les fichiers TypeScript/JavaScript dans le répertoire src
    const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { cwd: basePath });
    
    console.log(`${colors.blue}Trouvé ${files.length} fichiers à analyser...${colors.reset}`);
    
    let totalModified = 0;
    
    // Traiter chaque fichier
    for (const file of files) {
      const filePath = path.join(basePath, file);
      const fileName = path.basename(filePath, path.extname(filePath));
      
      // Corriger les imports dans le fichier
      const importsFixed = fixImportsInFile(filePath, fileName);
      
      // Corriger les exports dans le fichier
      const exportsFixed = fixExportsInFile(filePath, fileName);
      
      if (importsFixed || exportsFixed) {
        totalModified++;
      }
    }
    
    console.log(`${colors.cyan}Terminé! ${totalModified} fichiers ont été modifiés.${colors.reset}`);
    
    // Vérification spécifique pour App.tsx et JobNexAILanding.tsx
    const criticalFiles = [
      'src/App.tsx',
      'src/components/JobNexAILanding.tsx'
    ];
    
    console.log(`${colors.yellow}Vérification des fichiers critiques...${colors.reset}`);
    
    for (const file of criticalFiles) {
      const filePath = path.join(basePath, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`${colors.blue}Vérification de ${file}...${colors.reset}`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (file === 'src/App.tsx') {
          // Vérifier si JobNexAILanding est correctement importé avec lazy
          if (!content.includes('import(\'./components/JobNexAILanding\').then(module => ({')) {
            console.log(`${colors.yellow}⚠️ Attention: L'import lazy pour JobNexAILanding dans App.tsx pourrait ne pas être correctement configuré.${colors.reset}`);
          } else {
            console.log(`${colors.green}✓ L'import lazy pour JobNexAILanding dans App.tsx est correctement configuré.${colors.reset}`);
          }
        }
        
        if (file === 'src/components/JobNexAILanding.tsx') {
          // Vérifier si les composants sont importés avec des imports nommés
          let allCorrect = true;
          
          for (const component of ['Hero', 'Features', 'HowItWorks', 'Testimonials', 'Footer']) {
            if (!content.includes(`import { ${component} } from './${component}'`)) {
              console.log(`${colors.yellow}⚠️ Attention: L'import pour ${component} dans JobNexAILanding.tsx pourrait ne pas être un import nommé.${colors.reset}`);
              allCorrect = false;
            }
          }
          
          if (allCorrect) {
            console.log(`${colors.green}✓ Tous les imports dans JobNexAILanding.tsx sont correctement configurés.${colors.reset}`);
          }
        }
      } else {
        console.log(`${colors.red}✗ Fichier non trouvé: ${file}${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'exécution du script:${colors.reset}`, error);
    process.exit(1);
  }
}

// Exécuter le script
main();
