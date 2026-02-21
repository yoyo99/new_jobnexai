# Configuration Google OAuth pour JobNexAI

## Étapes de configuration dans Supabase

### 1. Accéder au dashboard Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet JobNexAI

### 2. Configurer Google OAuth
1. Dans la sidebar, allez dans **Authentication** > **Providers**
2. Trouvez **Google** dans la liste
3. Activez le toggle (s'il ne l'est pas déjà)
4. Remplissez les champs avec vos identifiants Google OAuth
5. Cliquez sur **Save**

### 3. Configurer l'URL de redirection dans Google Cloud Console

Vous devez ajouter l'URL de callback Supabase dans votre configuration Google Cloud :

1. Allez sur https://console.cloud.google.com/
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Trouvez votre OAuth 2.0 Client ID
5. Cliquez sur l'icône ✏️ pour modifier
6. Dans **Authorized redirect URIs**, ajoutez :
   ```
   https://VOTRE-PROJET.supabase.co/auth/v1/callback
   ```
   (Remplacez `VOTRE-PROJET` par votre vrai ID de projet Supabase)
7. Cliquez sur **Save**

### 4. Mettre à jour votre fichier .env

Assurez-vous que votre `.env` contient vos vraies clés Supabase :

```bash
# 🔥 SUPABASE (OBLIGATOIRE pour l'authentification Google OAuth)
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_VRAIE_CLE_ANON
```

### 5. Redémarrer et tester

1. Redémarrez votre application :
   ```bash
   npm run dev
   ```

2. Testez l'authentification Google :
   - Allez sur la page de connexion
   - Cliquez sur "Continuer avec Google"
   - Authentifiez-vous avec votre compte Google
   - Vous devriez être redirigé vers votre dashboard

## Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL dans Google Cloud Console correspond exactement à votre URL Supabase
- Format exact : `https://[PROJECT-ID].supabase.co/auth/v1/callback`

### Erreur "invalid_client"
- Vérifiez que le Client ID et Client Secret sont corrects dans Supabase
- Assurez-vous qu'il n'y a pas d'espaces ou de caractères supplémentaires

### L'authentification ne fonctionne pas
- Vérifiez que le provider Google est bien activé dans Supabase
- Vérifiez les logs du navigateur (F12) pour des erreurs JavaScript
- Assurez-vous que vos variables d'environnement sont correctement chargées

Une fois configuré, l'authentification Gmail devrait fonctionner parfaitement ! 🚀
