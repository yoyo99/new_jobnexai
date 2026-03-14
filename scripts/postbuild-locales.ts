/**
 * Script de postbuild pour les locales
 * Utilise tsx pour être exécuté correctement
 */

// Exemple de script - à adapter selon vos besoins
import fs from 'fs';
import path from 'path';

// Créer les dossiers de locales si nécessaire
const localesDir = path.join(process.cwd(), 'dist', 'locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Copier les fichiers de locales
const sourceDir = path.join(process.cwd(), 'public', 'locales');
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(localesDir, file);
    fs.copyFileSync(sourcePath, destPath);
  });
}

console.log('✅ Locales copiées avec succès');