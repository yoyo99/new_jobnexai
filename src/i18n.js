// Deprecated shim: i18n is now initialized exclusively in TypeScript at `src/i18n/index.ts`.
// This file intentionally avoids any initialization to prevent double init.
// It simply re-exports the already-initialized singleton instance and helpers.

export { default } from './i18n/index'
export * from './i18n/index'
