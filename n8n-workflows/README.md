# Workflows n8n - JobNexAI

## CV Screening Workflow

**Fichier** : `cv-screening-workflow.json`

**Description** : Workflow complet pour l'analyse automatisée de CV avec intelligence artificielle et notification par email.

---

## 🎯 Fonctionnalités

- ✅ Upload de CV au format PDF via formulaire web
- ✅ Extraction automatique du texte du CV
- ✅ Récupération et scraping de l'offre d'emploi depuis URL
- ✅ Analyse IA complète avec Mammouth.ai
- ✅ Génération de recommandations personnalisées
- ✅ Envoi d'email professionnel avec résultats détaillés
- ✅ Sauvegarde complète dans Supabase

---

## 📊 Architecture du Workflow (16 nœuds)

### 1. **Form Trigger - Upload CV**
- Type : Trigger
- Description : Formulaire web pour soumettre CV (PDF), URL de l'offre et email

### 2. **Extract - CV PDF**
- Type : Extraction
- Description : Extraction du texte depuis le fichier PDF uploadé

### 3. **Add Email to CV Data**
- Type : Code JavaScript
- Description : Récupération de l'email utilisateur depuis le formulaire et fusion avec les données du CV

### 4. **HTTP - Fetch Job Description**
- Type : HTTP Request
- Description : Récupération du contenu HTML de l'offre d'emploi depuis l'URL fournie

### 5. **Code in JavaScript**
- Type : Code JavaScript
- Description : Nettoyage et extraction du texte de l'offre d'emploi (suppression HTML, scripts, etc.)

### 6. **Merge**
- Type : Merge
- Description : Fusion des données du CV (avec email) et de l'offre d'emploi

### 7. **Merge CV + Job Data**
- Type : Code JavaScript
- Description : Consolidation des données fusionnées en un seul objet structuré

### 8. **Prepare Mammouth Request**
- Type : Set
- Description : Préparation de la requête pour l'API Mammouth.ai avec le prompt d'analyse

### 9. **Mammouth.ai - CV Analysis**
- Type : HTTP Request
- Description : Appel à l'API Mammouth.ai pour l'analyse IA du CV vs offre

### 10. **Set - Extract AI Response**
- Type : Set
- Description : Extraction et structuration de la réponse de l'IA

### 11. **Function - JSON Validator**
- Type : Code JavaScript
- Description : Validation, nettoyage et parsing de la réponse JSON de l'IA avec fallbacks

### 12. **IF**
- Type : Condition
- Description : Vérification du statut de validation (success/fallback)

### 13. **Debug - Check Email**
- Type : Code JavaScript
- Description : Vérification et logging des données email avant envoi

### 14. **HTTP Request**
- Type : HTTP Request (Resend API)
- Description : Envoi de l'email avec les résultats de l'analyse

### 15. **Merge Email + Analysis Data**
- Type : Set
- Description : Fusion des données d'analyse avec le résultat de l'envoi email

### 16. **Supabase - Save Analysis**
- Type : Supabase Insert
- Description : Sauvegarde de toutes les données dans la table `cv_analysis`

---

## 📧 Contenu de l'Email

L'email envoyé contient :

1. **Score de correspondance** : Pourcentage de matching (0-100%)
2. **Recommandation** : Analyse détaillée et recommandation d'embauche
3. **Points forts** : Liste des compétences et expériences pertinentes
4. **Points faibles** : Éléments manquants ou à clarifier
5. **Lien vers l'offre** : URL de l'offre d'emploi analysée
6. **Insights clés** : Points importants de l'analyse
7. **Questions d'entretien suggérées** : Questions pertinentes pour l'entretien

---

## 💾 Données Sauvegardées (Supabase)

Table : `cv_analysis`

Champs sauvegardés :
- `candidate_name` : Nom du candidat extrait du CV
- `user_email` : Email de l'utilisateur
- `job_url` : URL de l'offre d'emploi
- `matching_score` : Score de correspondance (0-100)
- `analysis_type` : Type d'analyse ("cv_screening")
- `validation_status` : Statut de validation ("success" ou "fallback")
- `analyzed_at` : Date et heure de l'analyse
- `analysis_data_preview` : JSON complet avec tous les détails de l'analyse

---

## 🔧 Configuration Requise

### Variables d'environnement n8n

- `MAMMOUTH_API_KEY` : Clé API Mammouth.ai
- `RESEND_API_KEY` : Clé API Resend
- `SUPABASE_URL` : URL du projet Supabase
- `SUPABASE_KEY` : Clé API Supabase

### Services externes

1. **Mammouth.ai** : API d'analyse IA
2. **Resend** : Service d'envoi d'emails
3. **Supabase** : Base de données PostgreSQL

---

## 📥 Import du Workflow

Pour importer ce workflow dans n8n :

1. Ouvrir n8n (http://localhost:5678)
2. Cliquer sur le menu (⋮) en haut à droite
3. Sélectionner **"Import from File"**
4. Choisir le fichier `cv-screening-workflow.json`
5. Configurer les credentials :
   - Mammouth.ai API
   - Resend API
   - Supabase
6. Activer le workflow

---

## 🧪 Test du Workflow

### Données de test

1. **CV** : Fichier PDF d'un CV (minimum 200 caractères de texte)
2. **URL de l'offre** : URL valide d'une offre d'emploi
3. **Email** : Adresse email valide pour recevoir les résultats

### Étapes de test

1. Accéder au formulaire généré par le trigger
2. Uploader un CV au format PDF
3. Saisir l'URL de l'offre d'emploi
4. Saisir une adresse email valide
5. Soumettre le formulaire
6. Vérifier l'email reçu
7. Vérifier les données dans Supabase

---

## 🐛 Gestion des Erreurs

Le workflow inclut plusieurs mécanismes de gestion d'erreurs :

1. **Validation de longueur** : CV et offre doivent contenir au moins 200 caractères
2. **Parsing JSON robuste** : Nettoyage automatique des réponses IA mal formatées
3. **Fallback par défaut** : Valeurs par défaut si l'analyse IA échoue
4. **Logging détaillé** : Console.log pour le débogage
5. **Validation des champs requis** : Vérification des champs obligatoires

---

## 📈 Améliorations Futures

- [ ] Ajout de la propagation correcte de `job_url`
- [ ] Support multi-langues pour les emails
- [ ] Dashboard de visualisation des analyses
- [ ] Export des résultats en PDF
- [ ] Intégration avec d'autres ATS (Applicant Tracking Systems)
- [ ] Analyse comparative de plusieurs CV
- [ ] Notifications Slack/Discord
- [ ] Tests automatisés du workflow

---

## 📝 Historique des Versions

### Version 1.0.0 (09/10/2025)
- ✅ Workflow complet fonctionnel
- ✅ Analyse IA avec Mammouth.ai
- ✅ Envoi d'email avec Resend
- ✅ Sauvegarde dans Supabase
- ✅ Template email professionnel
- ✅ Gestion d'erreurs robuste

---

## 👥 Contributeurs

- **Lionel AUBOIN** - Développement initial

---

## 📄 Licence

Ce workflow fait partie du projet JobNexAI.

---

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation n8n : https://docs.n8n.io
- Consulter la documentation Mammouth.ai
- Consulter la documentation Resend : https://resend.com/docs
