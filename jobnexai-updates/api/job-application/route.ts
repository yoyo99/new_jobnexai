'use server'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST - Créer une nouvelle candidature
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, jobId, status = 'pending' } = body

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "userId et jobId sont requis" },
        { status: 400 }
      )
    }

    // Vérifier d'abord les limites
    const limitCheck = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subscription/check-limit?userId=${userId}&action=apply`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    ).then(res => res.json())

    if (!limitCheck.success || !limitCheck.check.canProceed) {
      return NextResponse.json(
        { 
          error: limitCheck.error || limitCheck.check.reason || "Limite atteinte",
          limitReached: true,
          limitInfo: limitCheck.check
        },
        { status: 403 }
      )
    }

    // Vérifier si une candidature existe déjà pour ce job
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        userId,
        jobId
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "Candidature déjà existante pour ce poste" },
        { status: 400 }
      )
    }

    // Créer la candidature
    const application = await db.jobApplication.create({
      data: {
        userId,
        jobId,
        status
      }
    })

    return NextResponse.json({
      success: true,
      message: "Candidature créée avec succès",
      application
    })

  } catch (error) {
    console.error("Erreur lors de la création de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la candidature" },
      { status: 500 }
    )
  }
}

// GET - Récupérer les candidatures d'un utilisateur
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      )
    }

    const applications = await db.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      count: applications.length,
      applications
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des candidatures:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des candidatures" },
      { status: 500 }
    )
  }
}
