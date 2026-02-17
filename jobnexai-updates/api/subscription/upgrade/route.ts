'use server'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, plan } = body

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "userId et plan sont requis" },
        { status: 400 }
      )
    }

    // Valider le plan
    const validPlans = ['pro', 'enterprise']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Plan invalide. Plans disponibles: pro, enterprise" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur a un abonnement
    const existingSubscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé pour cet utilisateur" },
        { status: 404 }
      )
    }

    // Définir la période de facturation (30 jours)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    // Mettre à jour l'abonnement
    const subscription = await db.subscription.update({
      where: { userId },
      data: {
        plan,
        status: 'active',
        currentPeriodEnd,
        trialEndsAt: null, // L'essai est terminé
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Abonnement mis à jour vers le plan ${plan}`,
      subscription
    })

  } catch (error) {
    console.error("Erreur lors de l'upgrade:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'upgrade de l'abonnement" },
      { status: 500 }
    )
  }
}
