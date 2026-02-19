import { NextRequest, NextResponse } from 'next/server';

import { getRedisClient } from '@/lib/redisClient';
import { getS3ObjectBuffer, uploadDocumentToS3 } from '@/lib/s3';

import {
  generatePoleEmploiDocument,
  PoleEmploiLetterData,
} from './utils';

function validatePayload(payload: unknown): payload is PoleEmploiLetterData {
  if (!payload || typeof payload !== 'object') return false;
  const data = payload as PoleEmploiLetterData;
  return Boolean(
    data.user_info?.lastname &&
      data.user_info?.firstname &&
      data.user_info?.address &&
      data.user_info?.pole_emploi_id &&
      Array.isArray(data.period) &&
      data.period.length === 2 &&
      typeof data.period[0] === 'number' &&
      typeof data.period[1] === 'number' &&
      data.summary?.applications &&
      Array.isArray(data.summary.applications)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (!validatePayload(payload)) {
      return NextResponse.json(
        {
          error:
            "Requête invalide. Veuillez fournir user_info, period et summary conformes.",
        },
        { status: 400 }
      );
    }

    const [month, year] = payload.period;
    const templateType = payload.template_type ?? 'standard';

    const rawUserId =
      request.headers.get('x-user-id')?.trim() ||
      payload.user_info.pole_emploi_id ||
      `${payload.user_info.firstname}-${payload.user_info.lastname}`.replace(/\s+/g, '_');

    const redis = getRedisClient();
    const bucket = process.env.S3_BUCKET_POLE_EMPLOI;
    const redisTtlSeconds = Number(
      process.env.REDIS_POLE_EMPLOI_TTL_SECONDS ?? 7 * 24 * 60 * 60
    );
    const cacheKey = `pole-emploi:${rawUserId}:${month}-${year}:${templateType}`;
    const contentType =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (redis && bucket) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const cachedEntry: { s3Key?: string; filename?: string } = JSON.parse(cached);
          if (cachedEntry?.s3Key) {
            const cachedBuffer = await getS3ObjectBuffer({
              bucket,
              key: cachedEntry.s3Key,
            });

            const filenameFromCache = cachedEntry.filename ?? 'lettre_pole_emploi.docx';

            return new NextResponse(cachedBuffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filenameFromCache}"`,
                'Cache-Control': 'no-store',
              },
            });
          }
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache Redis/S3 indisponible, génération directe.', cacheError);
      }
    }

    const documentArrayBuffer = await generatePoleEmploiDocument(payload);
    const documentBuffer = Buffer.from(documentArrayBuffer);

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const filename = `lettre_pole_emploi_${payload.user_info.lastname}_${dateSuffix}.docx`;

    if (bucket) {
      const monthPadded = String(month).padStart(2, '0');
      const s3Key = `pole-emploi/${rawUserId}/${year}-${monthPadded}/${filename}`;

      try {
        await uploadDocumentToS3({
          bucket,
          key: s3Key,
          body: documentBuffer,
          contentType,
          cacheControl: 'max-age=31536000, immutable',
        });

        if (redis) {
          await redis.set(
            cacheKey,
            JSON.stringify({ s3Key, filename }),
            'EX',
            redisTtlSeconds
          );
        }
      } catch (storageError) {
        console.warn('⚠️ Sauvegarde S3/Redis échouée, réponse directe.', storageError);
      }
    }

    return new NextResponse(documentBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erreur génération courrier Pôle Emploi:', error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la génération du document.",
      },
      { status: 500 }
    );
  }
}
