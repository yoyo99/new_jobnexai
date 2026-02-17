'use server'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

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

    // Récupérer l'abonnement de l'utilisateur
    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: {
        user: true
      }
    })

    if (!subscription) {
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        message: "Aucun abonnement trouvé"
      })
    }

    // Vérifier si l'essai est expiré
    let isExpired = false
    let remainingTime = null

    if (subscription.plan === 'trial' && subscription.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(subscription.trialEndsAt)
      
      if (trialEnd <= now) {
        isExpired = true
        // Mettre à jour le statut
        if (subscription.status === 'active') {
          await db.subscription.update({
            where: { userId },
            data: { status: 'expired' }
          })
        }
      } else {
        remainingTime = Math.floor((trialEnd.getTime() - now.getTime()) / 1000 / 60 / 60) // en heures
      }
    }

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isExpired,
        remainingTimeHours: remainingTime
      }
    })

  } catch (error) {
    console.error("Erreur lors de la vérification du statut:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification du statut" },
      { status: 500 }
    )
  }
}
