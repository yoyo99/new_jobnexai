import { NextRequest, NextResponse } from 'next/server';

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

    const documentBuffer = await generatePoleEmploiDocument(payload);

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const filename = `lettre_pole_emploi_${payload.user_info.lastname}_${dateSuffix}.docx`;

    return new NextResponse(Buffer.from(documentBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
