// supabase/functions/export-cover-letter-from-content/index.ts
// Export a provided cover letter content as PDF or DOCX.
// Stores the file in Supabase Storage and returns a signed URL (default),
// or directly streams the file back when mode=download.

import { createClient } from '../_shared/deps.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// ESM pinned deps for Edge/Deno runtime
import {
  PDFDocument,
  StandardFonts,
} from 'https://cdn.jsdelivr.net/npm/pdf-lib@^1.17.1/dist/pdf-lib.esm.min.js';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from 'https://cdn.jsdelivr.net/npm/docx@^8.5.0/build/index.min.js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const EXPORT_BUCKET = Deno.env.get('EXPORT_BUCKET') ?? 'generated_letters';

function jsonResponse(body: unknown, origin: string | null, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function sanitizeFileName(name: string): string {
  // Keep alphanum, space, dash, underscore, dot
  return name
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9 _.-]/g, '')
    .trim()
    .slice(0, 100) || 'Cover-Letter';
}

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];
  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function ensureBucketExists(): Promise<void> {
  try {
    const { data } = await supabaseAdmin.storage.getBucket(EXPORT_BUCKET);
    if (!data) {
      await supabaseAdmin.storage.createBucket(EXPORT_BUCKET, { public: false });
    }
  } catch (_) {
    // Some self-hosted or older versions may throw on getBucket; try createBucket idempotently
    try { await supabaseAdmin.storage.createBucket(EXPORT_BUCKET, { public: false }); } catch { /* ignore */ }
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  try {
    // Auth (user must be authenticated)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing or invalid Authorization header' }, origin, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid JWT token' }, origin, 401);
    }

    // Input
    const url = new URL(req.url);
    const isGET = req.method === 'GET';
    const body = isGET ? {} : (await req.json().catch(() => ({})) || {});

    const rawContent = (body.content ?? url.searchParams.get('content')) as string | null;
    const rawFormat = (body.format ?? url.searchParams.get('format') ?? 'pdf') as string;
    const format = rawFormat.toLowerCase(); // 'pdf' | 'docx'
    const mode = ((body.mode ?? url.searchParams.get('mode') ?? 'store') as string).toLowerCase(); // 'store' | 'download'
    const filenameOverride = (body.filename ?? url.searchParams.get('filename')) as string | null;

    if (!rawContent || rawContent.trim().length === 0) {
      return jsonResponse({ error: 'Missing content' }, origin, 400);
    }

    // Clean content from markdown for export
    const content = rawContent.replace(/\*\*/g, '');

    // Generate file
    let mime = '';
    let ext = '';
    let fileBlob: Blob;

    if (format === 'docx') {
      // Build a minimal DOCX document
      const paragraphs: Paragraph[] = [];
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'Lettre de motivation', bold: true })],
        heading: HeadingLevel.HEADING_2,
      }));

      for (const p of content.replace(/\r\n/g, '\n').split('\n')) {
        if (p.trim().length === 0) {
          paragraphs.push(new Paragraph(''));
        } else {
          paragraphs.push(new Paragraph(p));
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      fileBlob = blob;
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = 'docx';
    } else {
      // Default: PDF
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      const maxWidth = page.getWidth() - 2 * margin;
      const lines = wrapText(content, font, fontSize, maxWidth);

      let y = page.getHeight() - margin;
      for (const line of lines) {
        if (y < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }
        if (line === '') {
          y -= fontSize * 1.5; // blank line spacing
          continue;
        }
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
        });
        y -= fontSize * 1.5;
      }

      const pdfBytes = await pdfDoc.save();
      fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      mime = 'application/pdf';
      ext = 'pdf';
    }

    const baseName = sanitizeFileName(
      filenameOverride || `Cover-Letter-From-Content`,
    );
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const objectPath = `${user.id}/manual/${ts}/${baseName}.${ext}`;

    // Store to Supabase Storage and return signed URL by default
    await ensureBucketExists();

    const uploadRes = await supabaseAdmin.storage
      .from(EXPORT_BUCKET)
      .upload(objectPath, fileBlob, { upsert: true, contentType: mime });

    if (uploadRes.error) {
      console.error('Storage upload error:', uploadRes.error);
      return jsonResponse({ error: 'Failed to store exported file' }, origin, 500);
    }

    if (mode === 'download') {
      // Direct download response
      return new Response(fileBlob, {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${baseName}.${ext}"`,
        },
      });
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(objectPath, 3600, { download: `${baseName}.${ext}` });

    if (signErr) {
      console.error('Create signed URL error:', signErr);
      return jsonResponse({ error: 'Failed to create signed URL', path: objectPath }, origin, 500);
    }

    return jsonResponse({
      bucket: EXPORT_BUCKET,
      path: objectPath,
      signedUrl: signed.signedUrl,
      expiresIn: 3600,
      format: ext,
    }, origin);
  } catch (e) {
    console.error('export-cover-letter-from-content error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: msg }, origin, 500);
  }
});
