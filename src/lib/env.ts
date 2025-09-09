// @ts-ignore
// Permet à TypeScript d'accepter Deno dans les environnements Node/Netlify
declare const Deno: any;
// Universal environment variable getter for Deno, Node.js, and Vite environments
export function getEnv(name: string): string | undefined {
  // Deno (Edge Functions, Deno Deploy, Supabase Edge)
  if (typeof Deno !== "undefined" && typeof Deno.env !== "undefined") {
    try {
      return Deno.env.get(name);
    } catch (_) {
      // Deno.env.get may throw if --allow-env is not set
      return undefined;
    }
  }
    // Node.js pure (Netlify Functions, SSR, etc.)
  if (typeof process !== "undefined" && process.env) {
    if (process.env[name] !== undefined) return process.env[name];
    if (process.env[`VITE_${name}`] !== undefined) return process.env[`VITE_${name}`];
  }
  return undefined;
}
