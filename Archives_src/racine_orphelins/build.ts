import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

const entryPoints = fs.readdirSync(path.resolve(__dirname, 'src'))
  .filter(file => file.endsWith('.tsx'))
  .map(file => path.resolve(__dirname, 'src', file));

esbuild.build({
  entryPoints: entryPoints,
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm',
  platform: 'node',
  target: ['esnext'],
  sourcemap: true,
  external: ['react', 'react-dom'],
}).catch(() => process.exit(1));