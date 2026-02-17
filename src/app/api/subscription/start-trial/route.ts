'use server'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email, name } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId et email sont requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur a déjà un abonnement
    const existingSubscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (existingSubscription) {
      // Si l'essai est déjà en cours et toujours valide
      if (existingSubscription.plan === 'trial' && 
          existingSubscription.status === 'active' &&
          existingSubscription.trialEndsAt &&
          new Date(existingSubscription.trialEndsAt) > new Date()) {
        return NextResponse.json({
          success: true,
          message: "Essai déjà en cours",
          subscription: existingSubscription
        })
      }
      
      // Si l'essai a expiré
      if (existingSubscription.plan === 'trial' && 
          existingSubscription.trialEndsAt &&
          new Date(existingSubscription.trialEndsAt) <= new Date()) {
        // Marquer l'essai comme expiré
        await db.subscription.update({
          where: { userId },
          data: { status: 'expired' }
        })
        return NextResponse.json(
          { error: "L'essai de 24h a expiré. Veuillez choisir un plan payant." },
          { status: 400 }
        )
      }
    }

    // Créer ou mettre à jour l'utilisateur
    const user = await db.user.upsert({
      where: { email },
      update: { name },
      create: {
        id: userId,
        email,
        name
      }
    })

    // Créer l'abonnement d'essai (24h)
    const trialEndsAt = new Date()
    trialEndsAt.setHours(trialEndsAt.getHours() + 24)

    const subscription = await db.subscription.upsert({
      where: { userId },
      update: {
        plan: 'trial',
        status: 'active',
        trialEndsAt,
        updatedAt: new Date()
      },
      create: {
        userId,
        plan: 'trial',
        status: 'active',
        trialEndsAt
      }
    })

    return NextResponse.json({
      success: true,
      message: "Essai de 24h démarré avec succès",
      subscription,
      user
    })

  } catch (error) {
    console.error("Erreur lors du démarrage de l'essai:", error)
    return NextResponse.json(
      { error: "Erreur lors du démarrage de l'essai" },
      { status: 500 }
    )
  }
}
