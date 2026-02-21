# Guide d'activation de l'authentification Google OAuth dans Supabase

## Étape 1: Configuration dans le dashboard Supabase

1. **Connectez-vous à votre dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Activez Google OAuth**
   - Dans la sidebar, allez dans `Authentication` > `Providers`
   - Trouvez `Google` dans la liste des providers
   - Cliquez sur le toggle pour l'activer

3. **Configurez les identifiants Google OAuth**
   - Vous aurez besoin d'un `Client ID` et `Client Secret` de Google Cloud Console

## Étape 2: Créer des identifiants Google OAuth

1. **Allez sur Google Cloud Console**
   - https://console.cloud.google.com/
   - Sélectionnez votre projet ou créez-en un

2. **Activez l'API Google+**
   - Dans la sidebar, allez à `APIs & Services` > `Library`
   - Cherchez "Google+ API" ou "People API"
   - Activez l'API

3. **Configurez l'écran de consentement OAuth**
   - Allez dans `APIs & Services` > `OAuth consent screen`
   - Choisissez `External` (pour production) ou `Internal` (pour tests)
   - Remplissez les informations requises :
     - Nom de l'application
     - Email de support
     - Logo de l'application

4. **Créez les identifiants OAuth**
   - Allez dans `APIs & Services` > `Credentials`
   - Cliquez sur `Create Credentials` > `OAuth client ID`
   - Sélectionnez `Web application`
   - Ajoutez les `Authorized redirect URIs` :
     ```
     https://[VOTRE-PROJET-SUPABASE].supabase.co/auth/v1/callback
     ```
   - Copiez le `Client ID` et `Client Secret`

## Étape 3: Finaliser la configuration Supabase

1. **Retournez au dashboard Supabase**
   - Dans `Authentication` > `Providers` > `Google`
   - Collez le `Client ID` et `Client Secret` de Google
   - Cliquez sur `Save`

## Étape 4: Variables d'environnement

Assurez-vous que vos variables d'environnement sont correctement configurées :

```bash
# Dans votre fichier .env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

## Étape 5: Tester l'authentification

1. **Démarrez votre application**
   ```bash
   npm run dev
   ```

2. **Testez la connexion Google**
   - Allez sur votre page de connexion
   - Cliquez sur "Continuer avec Google"
   - Vous devriez être redirigé vers Google pour l'authentification

## Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de redirection dans Google Cloud Console correspond exactement à :
  `https://[VOTRE-PROJET-SUPABASE].supabase.co/auth/v1/callback`

### Erreur "invalid_client"
- Vérifiez que le Client ID et Client Secret sont corrects dans Supabase

### Erreur "access_denied"
- L'utilisateur a refusé l'accès ou l'application n'est pas configurée correctement

### L'authentification ne fonctionne pas
- Vérifiez que l'API Google+ est activée
- Vérifiez que l'écran de consentement OAuth est configuré
- Vérifiez les logs du navigateur pour des erreurs JavaScript

## Sécurité

- Utilisez toujours des URLs HTTPS en production
- Ne partagez jamais votre Client Secret
- Limitez les domaines autorisés dans Google Cloud Console
- Activez la validation 2FA sur votre compte Google Cloud

## Notes importantes

- L'authentification Google OAuth nécessite HTTPS en production
- Les utilisateurs auront besoin d'un compte Google pour s'authentifier
- Les informations de profil (nom, avatar) seront automatiquement importées
- Vous pouvez personnaliser les champs de profil dans le callback d'authentification
