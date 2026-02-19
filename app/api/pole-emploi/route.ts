import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getRedisClient } from '@/lib/redisClient';
import { getS3ObjectBuffer, uploadDocumentToS3 } from '@/lib/s3';

import {
  generatePoleEmploiDocument,
  PoleEmploiLetterData,
} from './utils';

// Zod schema for validation
const UserInfoSchema = z.object({
  lastname: z.string().min(1, "Le nom est obligatoire"),
  firstname: z.string().min(1, "Le prénom est obligatoire"),
  address: z.string().min(1, "L'adresse est obligatoire"),
  pole_emploi_id: z.string().min(1, "L'identifiant Pôle Emploi est obligatoire"),
});

const ApplicationSummarySchema = z.object({
  applications: z.array(
    z.object({
      title: z.string().optional(),
      company: z.string().optional(),
      date: z.string().optional(),
      status: z.string().optional(),
    })
  ),
});

const PoleEmploiLetterSchema = z.object({
  user_info: UserInfoSchema,
  period: z.tuple([z.number(), z.number()]),
  summary: ApplicationSummarySchema,
  template_type: z.string().optional(),
});

type ValidatedPoleEmploiLetterData = z.infer<typeof PoleEmploiLetterSchema>;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validate payload using Zod
    const validationResult = PoleEmploiLetterSchema.safeParse(payload);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => `
- ${err.path.join('.')}: ${err.message}`).join('');
      
      return NextResponse.json(
        {
          error: `Requête invalide. Veuillez corriger les erreurs suivantes :${errorMessages}`,
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const [month, year] = validatedData.period;
    const templateType = validatedData.template_type ?? 'standard';

    const rawUserId =
      request.headers.get('x-user-id')?.trim() ||
      validatedData.user_info.pole_emploi_id ||
      `${validatedData.user_info.firstname}-${validatedData.user_info.lastname}`.replace(/\s+/g, '_');

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

    const documentArrayBuffer = await generatePoleEmploiDocument(validatedData);
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
