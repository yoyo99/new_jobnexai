// supabase/functions/update-profile/index.ts
// Edge Function Deno: met à jour le profil authentifié avec quelques champs autorisés.
// Exécuter localement: deno run --allow-net --allow-env supabase/functions/update-profile/index.ts

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

type Json = Record<string, unknown>;

// ————————————————————————————————————————
// Utils
// ————————————————————————————————————————
function jsonResponse(body: Json, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
};

function isString(v: unknown): v is string {
  return typeof v === "string";
}

// Validation très simple de TVA intra (regex basiques, sans checksum)
function validateEUVat(tvaRaw: unknown): string | null {
  if (!isString(tvaRaw)) return null; // rien à valider si non fourni
  const tva = tvaRaw.toUpperCase().replace(/\s+/g, "");
  if (!tva) return null;

  let valid = false;
  const cc = tva.slice(0, 2);

  switch (cc) {
    case "FR":
      // FR + 2 alphanum + 9 chiffres (approximation)
      valid = /^FR[0-9A-Z]{2}[0-9]{9}$/.test(tva);
      break;
    case "LU":
      // LU + 8 chiffres
      valid = /^LU[0-9]{8}$/.test(tva);
      break;
    case "BE":
      // BE + 10 chiffres
      valid = /^BE[0-9]{10}$/.test(tva);
      break;
    default:
      // Fallback générique: 2 lettres + 2 à 12 alphanum
      valid = /^([A-Z]{2})([0-9A-Z]{2,12})$/.test(tva);
  }

  if (!valid) {
    return "Le numéro de TVA intracommunautaire semble invalide.";
  }
  return null;
}

// Liste blanche de colonnes modifiables dans public.profiles
// → Adapte ce tableau à ton schéma réel pour éviter les erreurs "column does not exist".
const ALLOWED_FIELDS = new Set([
  "full_name",
  "company",
  "vat_number", // si ta colonne s'appelle "tva", remplace ici
  "headline",
  "location",
  "bio",
  "website",
  "phone",
  "avatar_url",
]);

// ————————————————————————————————————————
// Handler
// ————————————————————————————————————————
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // 1) Auth: Bearer <jwt utilisateur>
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Non authentifié" }, 401, CORS_HEADERS);
    }
    const jwt = authHeader.substring("Bearer ".length).trim();

    // 2) Supabase client avec JWT utilisateur
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Variables d'environnement manquantes (SUPABASE_URL/ANON_KEY)" }, 500, CORS_HEADERS);
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // 3) User courant
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return jsonResponse({ error: "Token invalide" }, 401, CORS_HEADERS);
    }
    const user = userRes.user;

    // 4) Payload
    let body: Json;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "JSON invalide" }, 400, CORS_HEADERS);
    }

    // (optionnel) si un id est fourni, il doit correspondre
    const bodyId = body["id"];
    if (isString(bodyId) && bodyId !== user.id) {
      return jsonResponse({ error: "Interdit: tentative de mise à jour d'un autre utilisateur" }, 403, CORS_HEADERS);
    }

    // 5) Validation TVA (si champ fourni)
    // Supporte vat_number | tva | vat
    const vatCandidate = (body["vat_number"] ??
      body["tva"] ??
      body["vat"]) as unknown;
    const vatErr = validateEUVat(vatCandidate);
    if (vatErr) {
      return jsonResponse({ error: vatErr }, 400, CORS_HEADERS);
    }

    // 6) Filtrer les champs autorisés et normaliser "tva" -> "vat_number" si besoin
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (k === "tva") {
        if (ALLOWED_FIELDS.has("vat_number")) update["vat_number"] = v;
        continue;
      }
      if (ALLOWED_FIELDS.has(k)) {
        update[k] = v;
      }
    }

    if (Object.keys(update).length === 0) {
      return jsonResponse({ error: "Aucun champ autorisé fourni" }, 400, CORS_HEADERS);
    }

    // 7) Update profil
    const { error: upErr } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (upErr) {
      return jsonResponse({ error: "Échec de la mise à jour du profil", details: upErr.message }, 400, CORS_HEADERS);
    }

    return jsonResponse({ ok: true, updated_fields: Object.keys(update) }, 200, CORS_HEADERS);
  } catch (e) {
    return jsonResponse({ error: "Erreur serveur", details: String(e) }, 500, CORS_HEADERS);
  }
});
