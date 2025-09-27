// scripts/normalize-jobs-urls.ts
// Parcourt la table public.jobs et normalise les URLs in-place.
// Usage (Deno):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... deno run --allow-env --allow-net scripts/normalize-jobs-urls.ts
// Options (env):
//   BATCH_SIZE=500               Taille des lots (par défaut 500)
//   DRY_RUN=true|false           Si true, ne fait que LOG sans UPDATE (par défaut false)
//   MERGE_ON_CONFLICT=skip|delete_current
//                                - skip (défaut): log les conflits d’unicité et passe
//                                - delete_current: supprime la ligne courante (⚠️ attention aux FK/RLS)
//   ENFORCE_HTTPS=true|false     Passe les http en https (par défaut false)
//   REMOVE_WWW=true|false        Supprime "www." (par défaut false)

import { createClient, type PostgrestError } from "npm:@supabase/supabase-js@2.39.3";
import normalizeUrl from "../utils/normalizeUrl.ts";

type JobRow = { id: number; url: string | null };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.");
  Deno.exit(1);
}

const BATCH_SIZE = parseInt(Deno.env.get("BATCH_SIZE") ?? "500", 10);
const DRY_RUN = (Deno.env.get("DRY_RUN") ?? "false").toLowerCase() === "true";
const MERGE_ON_CONFLICT = (Deno.env.get("MERGE_ON_CONFLICT") ?? "skip").toLowerCase() as
  | "skip"
  | "delete_current";

const ENFORCE_HTTPS = (Deno.env.get("ENFORCE_HTTPS") ?? "false").toLowerCase() === "true";
const REMOVE_WWW = (Deno.env.get("REMOVE_WWW") ?? "false").toLowerCase() === "true";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// counters
let scanned = 0;
let unchanged = 0;
let updated = 0;
let conflictsSkipped = 0;
let conflictsDeleted = 0;
let errors = 0;

function isUniqueViolation(err: PostgrestError | null): boolean {
  if (!err) return false;
  const code = (err as unknown as { code?: string }).code;
  const msg =
    `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`.toLowerCase();
  return code === "23505" ||
    msg.includes("duplicate key") ||
    msg.includes("unique constraint") ||
    msg.includes("jobs_url_key");
}

async function run() {
  console.log(
    `[normalize] start BATCH_SIZE=${BATCH_SIZE} DRY_RUN=${DRY_RUN} MERGE_ON_CONFLICT=${MERGE_ON_CONFLICT} enforceHttps=${ENFORCE_HTTPS} removeWWW=${REMOVE_WWW}`,
  );

  let lastId = 0;

  while (true) {
    const { data, error } = await supabase
      .from("jobs")
      .select("id,url")
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error("[normalize] select error:", error);
      errors++;
      break;
    }
    if (!data || data.length === 0) break;

    for (const row of data as JobRow[]) {
      scanned++;
      lastId = row.id;

      const original = (row.url ?? "").trim();
      if (!original) {
        // tu as déjà imposé NOT NULL + CHECK > 0, mais par prudence:
        continue;
      }

      const norm = normalizeUrl(original, {
        enforceHttps: ENFORCE_HTTPS,
        removeWWW: REMOVE_WWW,
      });

      if (norm === original) {
        unchanged++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[dry-run] id=${row.id} url: "${original}" -> "${norm}"`);
        continue;
      }

      // Tentative d’UPDATE unitaire
      const { error: updErr } = await supabase
        .from("jobs")
        .update({ url: norm })
        .eq("id", row.id);

      if (!updErr) {
        updated++;
        continue;
      }

      if (isUniqueViolation(updErr)) {
        if (MERGE_ON_CONFLICT === "delete_current") {
          // Attention: nécessite que d’éventuelles FK acceptent le delete (cascade ou pas de référence)
          const { error: delErr } = await supabase.from("jobs").delete().eq("id", row.id);
          if (delErr) {
            console.warn(
              `[conflict][delete_failed] id=${row.id} "${original}" -> "${norm}":`,
              delErr,
            );
            errors++;
          } else {
            conflictsDeleted++;
            console.log(
              `[conflict][deleted] id=${row.id} "${original}" -> "${norm}" (déjà présent ailleurs)`,
            );
          }
        } else {
          conflictsSkipped++;
          console.log(
            `[conflict][skipped] id=${row.id} "${original}" -> "${norm}" (URL normalisée déjà existante)`,
          );
        }
      } else {
        console.error(
          `[normalize][update_error] id=${row.id} "${original}" -> "${norm}":`,
          updErr,
        );
        errors++;
      }
    }
  }

  console.log(
    `[normalize] done scanned=${scanned} unchanged=${unchanged} updated=${updated} conflictsSkipped=${conflictsSkipped} conflictsDeleted=${conflictsDeleted} errors=${errors}`,
  );
}

if (import.meta.main) {
  run().catch((e) => {
    console.error("[normalize] fatal:", e);
    Deno.exit(1);
  });
}
