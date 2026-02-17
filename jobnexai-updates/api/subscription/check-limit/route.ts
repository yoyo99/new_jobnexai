'use server'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

interface LimitCheck {
  canProceed: boolean
  current: number
  limit: number | null
  remaining: number | null
  reason?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') // 'apply', 'search', etc.

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement
    const subscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 403 }
      )
    }

    // Vérifier si l'essai est expiré
    if (subscription.plan === 'trial' && subscription.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(subscription.trialEndsAt)
      
      if (trialEnd <= now) {
        return NextResponse.json(
          { error: "L'essai de 24h a expiré. Veuillez choisir un plan payant." },
          { status: 403 }
        )
      }
    }

    // Définir les limites selon le plan
    const limits = {
      trial: {
        applications: 5,
        jobSearches: 50,
        cvOptimizations: 3
      },
      pro: {
        applications: null, // illimité
        jobSearches: null,
        cvOptimizations: null
      },
      enterprise: {
        applications: null,
        jobSearches: null,
        cvOptimizations: null
      }
    }

    const planLimits = limits[subscription.plan as keyof typeof limits] || limits.trial

    // Compter les utilisations actuelles
    const applicationCount = await db.jobApplication.count({
      where: {
        userId,
        createdAt: {
          gte: subscription.trialEndsAt || subscription.currentPeriodEnd || subscription.createdAt
        }
      }
    })

    // Vérifier les limites selon l'action demandée
    let result: LimitCheck

    if (action === 'apply') {
      const limit = planLimits.applications
      const current = applicationCount
      
      result = {
        canProceed: limit === null || current < limit,
        current,
        limit,
        remaining: limit === null ? null : Math.max(0, limit - current),
        reason: limit !== null && current >= limit ? `Limite de ${limit} candidatures atteinte pour l'essai` : undefined
      }
    } else {
      // Vérification générale
      result = {
        canProceed: true,
        current: applicationCount,
        limit: planLimits.applications,
        remaining: planLimits.applications === null ? null : Math.max(0, planLimits.applications - applicationCount)
      }
    }

    return NextResponse.json({
      success: true,
      plan: subscription.plan,
      limits: planLimits,
      usage: {
        applications: applicationCount
      },
      check: result
    })

  } catch (error) {
    console.error("Erreur lors de la vérification des limites:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification des limites" },
      { status: 500 }
    )
  }
}
