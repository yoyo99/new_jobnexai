// utils/normalizeUrl.ts
// Normalise une URL de façon sûre et configurable.
//
// Objectifs par défaut (conservateurs):
// - Conserver le schéma/protocole existant (sauf enforceHttps).
// - Minifier l’hôte (lowercase), retirer les ports par défaut.
// - Optionnel: retirer "www.", supprimer les paramètres de tracking, trier les query params, etc.
//
// Usage:
//   normalizeUrl("HTTP://www.Example.com:80/a?utm_source=x&b=2#frag", {
//     enforceHttps: true,
//     removeWWW: true,
//     stripTrackingParams: true,
//     sortQueryParameters: true,
//     removeTrailingSlash: true,
//     dropHash: true,
//   });
//
// Remarque: Par défaut, on ne touche PAS aux query params ni au hash pour éviter
// des fusions agressives. Active explicitement les options si tu veux dédupliquer plus fort.

export type NormalizeOptions = {
  enforceHttps?: boolean;            // Passe http -> https (retire port 80)
  removeWWW?: boolean;               // Supprime le préfixe "www."
  stripTrackingParams?: boolean | string[]; // true = liste par défaut, array = noms personnalisés
  sortQueryParameters?: boolean;     // Trie les query params pour stabilité
  removeDefaultPorts?: boolean;      // Retire :80 (http) et :443 (https) (défaut: true)
  removeEmptyQueryParams?: boolean;  // Retire les paramètres dont la valeur === "" (défaut: false)
  removeTrailingSlash?: boolean;     // Retire le slash final si path ≠ "/" (défaut: false)
  dropHash?: boolean;                // Supprime le fragment (#...) (défaut: false)
};

const DEFAULT_TRACKING_PARAMS = new Set<string>([
  // Ads/analytics
  "gclid", "fbclid", "dclid", "msclkid", "gbraid", "wbraid", "yclid",
  // Email/CRM
  "mc_cid", "mc_eid", "_hsenc", "_hsmi", "vero_id",
  // Referrals
  "ref", "referrer", "ref_src", "ref_url",
  // Divers souvent non déterminants pour l'identité
  "source", "src", "campaign", "cmp",
]);

/**
 * Retourne true si la clé est considérée comme un paramètre de tracking.
 * - utm_* et hsa_* (HubSpot Ads) sont toujours considérés tracking.
 * - Sinon, on check la liste par défaut (ou personnalisée).
 */
function isTrackingKey(keyLower: string, customListOrSet?: string[] | boolean | Set<string>): boolean {
  if (keyLower.startsWith("utm_")) return true;
  if (keyLower.startsWith("hsa_")) return true;

  if (customListOrSet instanceof Set) {
    return customListOrSet.has(keyLower);
  }
  if (Array.isArray(customListOrSet)) {
    // Recherche linéaire pour compatibilité (optimisable avec Set pour grandes listes)
    for (const k of customListOrSet) {
      if (keyLower === k.toLowerCase()) return true;
    }
    return false;
  }

  // customList === true ou undefined -> utiliser la liste par défaut
  return DEFAULT_TRACKING_PARAMS.has(keyLower);
}

export default function normalizeUrl(input: string, opts: NormalizeOptions = {}): string {
  const {
    enforceHttps = false,
    removeWWW = false,
    stripTrackingParams = false,
    sortQueryParameters = false,
    removeDefaultPorts = true,
    removeEmptyQueryParams = false,
    removeTrailingSlash = false,
    dropHash = false,
  } = opts;

  const raw = (input ?? "").trim();
  if (!raw) return raw;

  // Si le schéma manque (ex: "example.com/path"), on préfixe pour parser.
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);
  const withScheme = hasScheme ? raw : `http://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    // Si non parseable, renvoyer la chaîne trim sans casser le flux
    return raw;
  }

  // On ne normalise vraiment que http(s). Pour d'autres schémas, on renvoie tel quel.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return url.toString();
  }

  // Hostname en lowercase
  url.hostname = url.hostname.toLowerCase();

  // Option: supprimer "www."
  if (removeWWW && url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
  }

  // Option: forcer HTTPS
  if (enforceHttps && url.protocol === "http:") {
    url.protocol = "https:";
    // Si on passe en https, un port 80 devient sans objet
    if (url.port === "80") url.port = "";
  }

  // Option: retirer les ports par défaut
  if (removeDefaultPorts) {
    if (url.protocol === "http:" && url.port === "80") url.port = "";
    if (url.protocol === "https:" && url.port === "443") url.port = "";
  }

  // Option: nettoyer les query params
  if (stripTrackingParams || removeEmptyQueryParams || sortQueryParameters) {
    const params = url.searchParams;

    // 1) retirer tracking
    if (stripTrackingParams) {
      // Optimisation: convertir array en Set pour recherche O(1) sur grandes listes
      let customTrackingParamsSet: Set<string> | boolean | string[] = stripTrackingParams;
      if (Array.isArray(stripTrackingParams)) {
        customTrackingParamsSet = new Set(stripTrackingParams.map(s => s.toLowerCase()));
      }

      const toDelete: string[] = [];
      params.forEach((_, key) => {
        const lower = key.toLowerCase();
        if (isTrackingKey(lower, customTrackingParamsSet)) {
          toDelete.push(key);
        }
      });
      for (const k of toDelete) params.delete(k);
    }

    // 2) retirer params vides
    if (removeEmptyQueryParams) {
      const toDelete: string[] = [];
      params.forEach((value, key) => {
        if (value === "") toDelete.push(key);
      });
      for (const k of toDelete) params.delete(k);
    }

    // 3) trier les params pour stabilité
    if (sortQueryParameters) {
      const entries: Array<[string, string]> = [];
      params.forEach((value, key) => {
        entries.push([key, value]);
      });
      entries.sort((a, b) => {
        if (a[0] === b[0]) return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
        return a[0] < b[0] ? -1 : 1;
      });
      // Rebuild
      url.search = "";
      for (const [k, v] of entries) {
        url.searchParams.append(k, v);
      }
    }
  }

  // Option: retirer trailing slash (sauf racine)
  if (removeTrailingSlash && url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  // Option: retirer le fragment
  if (dropHash) {
    url.hash = "";
  }

  return url.toString();
}
