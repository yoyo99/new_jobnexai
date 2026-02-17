# API de Gestion des Abonnements - JobNexAI

Cette documentation explique comment utiliser l'API de gestion des abonnements qui implémente le système d'essai de 24h.

## 📊 Modèle de Données

### Schéma Prisma

```prisma
model User {
  id                String         @id @default(cuid())
  email             String         @unique
  name              String?
  password          String?
  subscription      Subscription?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Subscription {
  id                String         @id @default(cuid())
  userId            String         @unique
  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan              String         @default("trial") // trial, pro, enterprise
  status            String         @default("active") // active, cancelled, expired
  trialEndsAt       DateTime?      // Date de fin de l'essai
  currentPeriodEnd  DateTime?      // Fin de la période de facturation
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model JobApplication {
  id                String         @id @default(cuid())
  userId            String
  jobId             String
  status            String         @default("pending") // pending, sent, rejected, accepted
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}
```

## 🔌 Endpoints API

### 1. Démarrer un essai de 24h

**Endpoint:** `POST /api/subscription/start-trial`

**Body:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "name": "John Doe" (optionnel)
}
```

**Réponse succès:**
```json
{
  "success": true,
  "message": "Essai de 24h démarré avec succès",
  "subscription": {
    "id": "sub_123",
    "userId": "user_123",
    "plan": "trial",
    "status": "active",
    "trialEndsAt": "2024-01-16T10:00:00.000Z",
    "currentPeriodEnd": null
  },
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Réponse erreur (essai déjà en cours):**
```json
{
  "success": true,
  "message": "Essai déjà en cours",
  "subscription": { ... }
}
```

**Réponse erreur (essai expiré):**
```json
{
  "error": "L'essai de 24h a expiré. Veuillez choisir un plan payant."
}
```

### 2. Vérifier le statut de l'abonnement

**Endpoint:** `GET /api/subscription/status?userId={userId}`

**Réponse succès:**
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "id": "sub_123",
    "plan": "trial",
    "status": "active",
    "trialEndsAt": "2024-01-16T10:00:00.000Z",
    "currentPeriodEnd": null,
    "isExpired": false,
    "remainingTimeHours": 18
  }
}
```

**Réponse (pas d'abonnement):**
```json
{
  "success": true,
  "hasSubscription": false,
  "message": "Aucun abonnement trouvé"
}
```

### 3. Upgrader vers un plan payant

**Endpoint:** `POST /api/subscription/upgrade`

**Body:**
```json
{
  "userId": "user_123",
  "plan": "pro" // ou "enterprise"
}
```

**Réponse succès:**
```json
{
  "success": true,
  "message": "Abonnement mis à jour vers le plan pro",
  "subscription": {
    "id": "sub_123",
    "userId": "user_123",
    "plan": "pro",
    "status": "active",
    "trialEndsAt": null,
    "currentPeriodEnd": "2024-02-15T10:00:00.000Z"
  }
}
```

### 4. Vérifier les limites

**Endpoint:** `GET /api/subscription/check-limit?userId={userId}&action={action}`

**Actions disponibles:**
- `apply` - Pour une nouvelle candidature
- Autres actions à venir...

**Réponse succès (essai):**
```json
{
  "success": true,
  "plan": "trial",
  "limits": {
    "applications": 5,
    "jobSearches": 50,
    "cvOptimizations": 3
  },
  "usage": {
    "applications": 3
  },
  "check": {
    "canProceed": true,
    "current": 3,
    "limit": 5,
    "remaining": 2
  }
}
```

**Réponse (limite atteinte):**
```json
{
  "success": true,
  "plan": "trial",
  "limits": { ... },
  "usage": {
    "applications": 5
  },
  "check": {
    "canProceed": false,
    "current": 5,
    "limit": 5,
    "remaining": 0,
    "reason": "Limite de 5 candidatures atteinte pour l'essai"
  }
}
```

**Réponse (plan Pro/Enterprise - illimité):**
```json
{
  "success": true,
  "plan": "pro",
  "limits": {
    "applications": null,
    "jobSearches": null,
    "cvOptimizations": null
  },
  "usage": {
    "applications": 15
  },
  "check": {
    "canProceed": true,
    "current": 15,
    "limit": null,
    "remaining": null
  }
}
```

### 5. Créer une candidature

**Endpoint:** `POST /api/job-application`

**Body:**
```json
{
  "userId": "user_123",
  "jobId": "job_456",
  "status": "pending" (optionnel)
}
```

**Réponse succès:**
```json
{
  "success": true,
  "message": "Candidature créée avec succès",
  "application": {
    "id": "app_789",
    "userId": "user_123",
    "jobId": "job_456",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Réponse (limite atteinte):**
```json
{
  "error": "Limite de 5 candidatures atteinte pour l'essai",
  "limitReached": true,
  "limitInfo": {
    "canProceed": false,
    "current": 5,
    "limit": 5,
    "remaining": 0
  }
}
```

**Réponse (essai expiré):**
```json
{
  "error": "L'essai de 24h a expiré. Veuillez choisir un plan payant."
}
```

### 6. Récupérer les candidatures

**Endpoint:** `GET /api/job-application?userId={userId}`

**Réponse succès:**
```json
{
  "success": true,
  "count": 3,
  "applications": [
    {
      "id": "app_789",
      "userId": "user_123",
      "jobId": "job_456",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

## 💻 Utilisation depuis le Frontend

### Client API

Un client TypeScript est disponible dans `src/lib/api/subscription.ts`:

```typescript
import { subscriptionApi, jobApplicationApi } from '@/lib/api/subscription'

// Démarrer un essai
const result = await subscriptionApi.startTrial('user_123', 'user@example.com', 'John Doe')

// Vérifier le statut
const status = await subscriptionApi.getStatus('user_123')

// Upgrader
const upgradeResult = await subscriptionApi.upgrade('user_123', 'pro')

// Vérifier les limites
const limits = await subscriptionApi.checkLimit('user_123', 'apply')

// Créer une candidature
const application = await jobApplicationApi.create('user_123', 'job_456')

// Lister les candidatures
const applications = await jobApplicationApi.list('user_123')
```

## 📋 Limites par Plan

| Fonctionnalité | Essai (24h) | Pro | Enterprise |
|---------------|-------------|-----|------------|
| Candidatures | 5 | Illimité | Illimité |
| Recherches d'emploi | 50 | Illimité | Illimité |
| Optimisations CV | 3 | Illimité | Illimité |
| Durée | 24h | 30 jours | 30 jours |

## ⚠️ Notes Importantes

1. **Expiration automatique**: L'essai expire automatiquement après 24h
2. **Vérification automatique**: L'API vérifie automatiquement l'expiration à chaque appel
3. **Limites strictes**: Les limites de l'essai sont appliquées côté serveur
4. **Un essai par utilisateur**: Un utilisateur ne peut avoir qu'un seul essai
5. **Upgrade**: L'upgrade vers un plan payant désactive automatiquement l'essai

## 🔐 Sécurité

- Toutes les requêtes nécessitent un `userId` valide
- Les limites sont vérifiées côté serveur (pas de contournement possible)
- Les abonnements sont liés aux utilisateurs via une relation unique

## 🚀 Prochaines améliorations possibles

- Intégration avec Stripe pour les paiements
- Webhooks pour les notifications d'expiration
- Système de coupons/promotions
- Facturation automatique
- Annulation et réactivation d'abonnements
- Historique des changements de plan
