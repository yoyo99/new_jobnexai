# JobNexAI - Plateforme de Recherche d'Emploi Automatisée

JobNexAI est une plateforme moderne de recherche d'emploi qui utilise l'intelligence artificielle pour optimiser et automatiser votre recherche d'emploi. De l'optimisation de votre CV aux candidatures automatisées, JobNexAI simplifie votre parcours vers le poste idéal.

## Fonctionnalités

- **Recherche d'emploi intelligente**
  - Filtres avancés (type de contrat, localisation, salaire, etc.)
  - Suggestions personnalisées basées sur vos compétences
  - Système de notation des correspondances
  - Mode de travail (remote, hybride, sur site)

- **Gestion des candidatures**
  - Suivi des candidatures en cours
  - Organisation par statut (brouillon, postulée, entretien, etc.)
  - Notes et rappels pour chaque candidature
  - Planification des prochaines étapes

- **Profil et compétences**
  - Gestion de vos compétences avec niveaux de maîtrise
  - Préférences de recherche personnalisables
  - Historique des candidatures
  - Statistiques et analyses

- **Alertes et notifications**
  - Alertes emploi personnalisées
  - Notifications en temps réel
  - Rappels d'entretiens
  - Mises à jour des candidatures
- **Scraping en temps réel**
  - Déclenchement sécurisé via Netlify Function et webhook n8n avec `user_id` uniquement
  - Dashboard dédié `/app/dashboard/jobs` qui écoute `job_listings` et `scraping_history` avec Supabase Realtime
  - Fichette d'expérience live (progression, skeleton loaders, animations, filtres smart) pour suivre les offres palpables

## Technologies utilisées

- **Frontend**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Framer Motion
  - React Router
  - Zustand
  - i18next

- **Backend**
  - Supabase
  - PostgreSQL
  - Edge Functions
  - Row Level Security
  - Real-time subscriptions

## Prérequis

- Node.js 20.x ou supérieur
- npm 10.x ou supérieur
- Un compte Supabase

## Installation

1. Cloner le repository
```bash
git clone https://github.com/yoyo99/JobNexAI-WindSurf.git
cd jobnexai
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Remplir le fichier `.env` avec vos informations Supabase :
```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

4. Lancer l'application en développement
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## Structure du projet

```
jobnexai/
├── public/               # Assets statiques
│   └── locales/         # Fichiers de traduction
├── src/
│   ├── components/      # Composants React
│   ├── lib/            # Utilitaires et configuration
│   ├── stores/         # État global (Zustand)
│   ├── utils/          # Fonctions utilitaires
│   └── i18n/           # Configuration i18next
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Migrations SQL
└── package.json
```

## Fonctionnalités de sécurité

- **Authentification**
  - Authentification email/mot de passe
  - Sessions sécurisées
  - Protection CSRF

- **Autorisation**
  - Row Level Security (RLS)
  - Politiques d'accès granulaires
  - Isolation des données utilisateur

- **Protection des données**
  - Conformité RGPD
  - Chiffrement des données sensibles
  - Journalisation des audits

## Internationalisation

L'application est disponible en plusieurs langues :
- Français (par défaut)
- Anglais
- Espagnol
- Allemand
- Italien

## Déploiement

L'application peut être déployée sur Netlify :

1. Connecter le repository à Netlify
2. Configurer les variables d'environnement
3. Déployer avec la commande :
```bash
npm run build
```

## Sécurité et gestion des clés API

**ATTENTION :** Ne jamais exposer les clés sensibles (`VITE_OPENAI_API_KEY`, `RESEND_API_KEY`, `REACT_APP_API_KEY_SECRET`) dans le frontend ou dans le dépôt public. Ces clés doivent être stockées côté serveur (Edge Functions, variables d'environnement Netlify/Supabase).

- `.env` côté frontend : uniquement les variables publiques (ex : `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- `.env` côté serveur/Supabase : toutes les clés sensibles nécessaires

## Notifications par email (Resend)

La plateforme utilise une Supabase Edge Function pour envoyer des emails transactionnels via le service Resend.

- Code de la fonction : `supabase/functions/send-notification-email/index.ts`
- Appel côté frontend via le service `lib/emailService.js`
- Exemple d'utilisation :
  ```js
  import { notifyUser } from '../lib/notifyUser';
  await notifyUser({
    to: 'destinataire@email.com',
    subject: 'Sujet',
    text: 'Texte brut',
    html: '<b>Texte HTML</b>'
  });
  ```
- En cas d'échec, une notification d'erreur est affichée à l'utilisateur.

## Tests de notifications email

Des tests unitaires sont à ajouter dans `lib/emailService.test.js` pour simuler l'appel à la fonction et vérifier la gestion des erreurs (voir exemple dans le fichier).

## UI/UX pour les notifications email

- Un retour visuel (succès/erreur) est affiché à l'utilisateur après chaque tentative d'envoi d'email.
- Utiliser un composant de notification (toast) pour améliorer l'expérience utilisateur.

## Gestion des quotas Resend

- Surveiller les quotas gratuits/mois directement sur le dashboard Resend.
- En cas de dépassement, afficher un message d'erreur explicite à l'utilisateur.

## Sécurisation des Edge Functions

- Protéger les fonctions critiques côté Supabase (authentification, vérification de l'appelant, filtrage des emails autorisés, etc.).
- Limiter l'accès aux fonctions d'envoi d'email aux utilisateurs authentifiés ou à des rôles spécifiques.

---


## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## Bonnes pratiques de développement

### Structure du code

- **Composants React** : Les composants doivent être placés dans `src/components/` et organisés par fonctionnalité
- **Logique métier** : La logique métier doit être placée dans `src/lib/` ou `src/services/`
- **Gestion d'état** : Utiliser Zustand pour l'état global et React Query pour la gestion des données
- **Formulaires** : Utiliser `react-hook-form` pour tous les formulaires avec validation

### Tests

Le projet utilise Jest avec React Testing Library pour les tests unitaires :

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests unitaires
npm run test:unit

# Lancer les tests e2e (Playwright)
npm run test:e2e
```

**Structure des tests** :
- Les tests unitaires doivent être placés dans des fichiers `__tests__/` ou avec l'extension `.test.tsx`
- Les tests doivent couvrir les cas heureux, les erreurs et les états de chargement
- Utiliser `screen.getByRole()` de préférence pour une meilleure accessibilité

**Exemple de test** :
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  test('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  test('should handle button click', () => {
    const mockFn = jest.fn()
    render(<MyComponent onClick={mockFn} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockFn).toHaveBeenCalled()
  })
})
```

### Gestion des requêtes API

Utiliser React Query pour toutes les requêtes API :

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

// Requête de lecture
const { data, isLoading, error } = useQuery({
  queryKey: ['jobs', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data
  }
})

// Mutation pour création/mise à jour/suppression
const mutation = useMutation({
  mutationFn: async (newJob) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert(newJob)
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] })
  }
})
```

### Validation des données

Utiliser Zod pour la validation côté serveur et côté client :

```typescript
import { z } from 'zod'

// Schéma de validation
const JobSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  company: z.string().min(1, "La compagnie est obligatoire"),
  location: z.string().optional(),
  salary: z.number().positive("Le salaire doit être positif").optional()
})

type Job = z.infer<typeof JobSchema>

// Validation dans les endpoints API
const result = JobSchema.safeParse(requestBody)
if (!result.success) {
  return Response.json({ error: result.error }, { status: 400 })
}
```

### Formulaires avec react-hook-form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { register, handleSubmit, formState: { errors } } = useForm<Job>({
  resolver: zodResolver(JobSchema),
  defaultValues: {
    title: '',
    company: '',
    location: '',
    salary: undefined
  }
})

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('title')} />
  {errors.title && <span>{errors.title.message}</span>}
  <button type="submit">Submit</button>
</form>
```

### Bonnes pratiques de sécurité

1. **Ne jamais exposer les clés API** dans le code frontend
2. **Utiliser Row Level Security** dans Supabase pour toutes les tables
3. **Valider toutes les entrées** côté serveur avec Zod
4. **Utiliser des politiques CORS** restrictives
5. **Implémenter l'authentification** pour toutes les routes sensibles

### Performance

1. **Utiliser React.memo** pour les composants qui rendent souvent
2. **Implémenter le lazy loading** pour les composants lourds
3. **Optimiser les images** avec le format WebP et le lazy loading
4. **Utiliser la pagination** pour les listes longues
5. **Minimiser les re-renders** avec useMemo et useCallback

### Internationalisation

Le projet utilise i18next pour la gestion des traductions :

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <div>{t('welcome_message')}</div>
}
```

Les fichiers de traduction sont dans `public/locales/` et suivent la structure :
```
public/locales/
  en/
    translation.json
  fr/
    translation.json
  es/
    translation.json
```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe support à support@jobnexai.com

## Roadmap

## Fonctionnalités Avancées

### Fonctionnalités basées sur l'IA et l'analyse

**Matching de compétences prédictif :**
-   Concept: Au lieu de simplement comparer les mots-clés, l'IA pourrait analyser en profondeur les offres d'emploi et les profils des utilisateurs pour prédire la probabilité de réussite d'une candidature.
-   Bénéfices: Améliorer significativement la pertinence des suggestions d'emploi, réduire le temps de recherche, et augmenter les chances de trouver le "match parfait".

**Analyse sémantique des CV et lettres de motivation :**
-   Concept: L'IA peut aider à améliorer les CV et lettres de motivation en suggérant des reformulations, en identifiant des compétences clés manquantes ou des incohérences, et en adaptant le langage à l'offre d'emploi visée.
-   Bénéfices: Augmenter l'attractivité des candidatures, améliorer la qualité de la présentation, et aider les utilisateurs à mieux se vendre.

**Simulateur d'entretien d'embauche :**
-   Concept: Un environnement virtuel où les utilisateurs peuvent s'entraîner à des entretiens, avec des questions générées par l'IA et des feedbacks personnalisés sur leur performance.
-   Bénéfices: Réduire le stress des entretiens, améliorer les compétences de communication, et aider les utilisateurs à se préparer efficacement.

**Prédiction des tendances du marché du travail :**
-   Concept: L'IA pourrait analyser les données des offres d'emploi, des profils, des entreprises, etc., pour identifier les compétences en forte demande, les secteurs en croissance, et les évolutions salariales.
-   Bénéfices: Permettre aux utilisateurs de se positionner sur les marchés porteurs, d'anticiper les besoins futurs, et de prendre des décisions éclairées sur leur carrière.

**Réseautage intelligent:**
-   Concept: Utiliser l'IA pour suggérer des connexions pertinentes basées sur les compétences, l'expérience, les intérêts, et les objectifs de carrière.
-   Bénéfices: Faciliter le réseautage, augmenter les opportunités de carrière, et développer un réseau professionnel de qualité.

### Fonctionnalités sociales et collaboratives

**Communautés de soutien par métier :**
-   Concept: Des espaces dédiés où les utilisateurs d'un même domaine peuvent échanger des conseils, des ressources, et des opportunités.
-   Bénéfices: Favoriser le partage de connaissances, créer un sentiment d'appartenance, et permettre un soutien mutuel.

**Mentorat personnalisé:**
-   Concept: Mettre en relation des utilisateurs expérimentés avec des candidats plus juniors, pour un accompagnement individualisé.
-   Bénéfices: Accélérer la progression de carrière, bénéficier de conseils précieux, et créer des liens durables.

**Groupes de préparation aux entretiens :**
-   Concept: Des groupes virtuels où les utilisateurs peuvent s'entraîner ensemble, se donner des feedbacks, et se motiver mutuellement.
-   Bénéfices: Améliorer la préparation aux entretiens, créer du lien, et réduire l'isolement.

### Fonctionnalités d'automatisation et de gain de temps

**Candidature automatique intelligente :**
-   Concept: Une fonctionnalité qui permet de postuler à plusieurs offres d'emploi en un clic, tout en adaptant automatiquement la candidature aux exigences de chaque poste.
-   Bénéfices: Gain de temps considérable, réduction de la charge mentale, et augmentation du nombre de candidatures.

**CV et profil adaptable à l'offre**
-   Concept: Le CV et le profil s'adapte automatiquement aux offres d'emploi.
-   Bénéfices: Permet de mieux cibler l'offre, et d'être plus pertinent.

### Autres idées

**Certification et badges de compétences:**
-   Concept: Intégrer un système de certification ou de badges pour valider les compétences et les connaissances des utilisateurs.
-   Bénéfices: Augmenter la crédibilité, se démarquer des autres candidats, et valoriser son expertise.

**Intégration avec d'autres plateformes :**
-   Concept: Permettre aux utilisateurs de synchroniser leurs informations avec LinkedIn, GitHub, et d'autres plateformes professionnelles.
-   Bénéfices: Faciliter la gestion des données, gagner du temps, et maintenir une présence cohérente sur le web.

### Recommandations

Pour bien développer ces fonctionnalités, il est recommandé de :

-   Analyser en profondeur les besoins et les attentes de vos utilisateurs.
-   Tester les nouvelles fonctionnalités avec des groupes d'utilisateurs avant de les déployer à grande échelle.
-   Rester à l'affût des dernières innovations en matière d'IA et de marché du travail.
-   Continuer a utiliser des testimonials pour rassurer les utilisateurs.



- [ ] Intégration avec LinkedIn
- [ ] Analyse des tendances du marché
- [ ] Assistant IA pour la rédaction de CV
- [ ] Application mobile
- [ ] API publique

## Fonctionnalités spécifiques
- Différenciation personne morale/physique à l'inscription et à l'abonnement.
- Ajout d'un champ API KEY IA dans le profil utilisateur.
- Scraping de boîtes mails pour offres d'emploi (IMAP).
- Notifications programmées sur nouvelles offres.
- Protection admin des paramètres.