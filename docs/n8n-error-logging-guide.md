# 🚨 N8N ERROR LOGGING - GUIDE COMPLET

## 📋 Vue d'ensemble

Le système d'error logging JobNexAI capture automatiquement toutes les erreurs des workflows N8N, les classe par sévérité, les stocke dans Supabase et envoie des alertes pour les erreurs critiques.

---

## 🏗️ Architecture

```
Workflow Error → Error Handler → Extract Details → Supabase Log → Severity Check → Slack Alert
```

---

## 📊 Classification des Erreurs

### **CRITICAL** 🔴
- Erreurs Supabase (insert failed, connection lost)
- Erreurs Database (query failed, timeout)
- Perte de données

**Action** : Alerte Slack immédiate + Investigation urgente

### **HIGH** 🟠
- Enrichissement Mammouth.ai échoué
- Scraping raté (0 résultats)
- Validation JSON échouée

**Action** : Alerte Slack + Correction sous 24h

### **MEDIUM** 🟡
- Timeout (>30s)
- Rate limit (429)
- Proxy rotation échouée

**Action** : Log seulement + Correction sous 48h

### **LOW** 🟢
- Warnings mineurs
- Données manquantes non critiques

**Action** : Log seulement + Revue hebdomadaire

---

## 🔧 Installation

### **1. Créer la table Supabase**

```bash
# Exécuter la migration
psql -h klwugophjvzctlautsqz.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20251003_create_workflow_errors_table.sql
```

Ou via Supabase SQL Editor :
```sql
-- Copier/coller le contenu de la migration
```

### **2. Importer le workflow dans N8N**

1. Ouvrir N8N : http://38.242.238.205:5678
2. Cliquer sur "Add Workflow"
3. Cliquer sur ⋮ → "Import from File"
4. Sélectionner `error-handler-jobnexai.json`
5. Configurer les credentials :
   - Supabase (déjà configuré)
   - Slack Webhook (optionnel)

### **3. Configurer Slack (Optionnel)**

1. Créer un Slack Webhook :
   - https://api.slack.com/messaging/webhooks
   - Créer une app Slack
   - Activer Incoming Webhooks
   - Copier l'URL du webhook

2. Dans le workflow N8N :
   - Ouvrir le node "Slack - Alert Critical"
   - Remplacer `YOUR_SLACK_WEBHOOK` par votre URL
   - Sauvegarder

### **4. Définir comme Error Handler par défaut**

**Méthode 1 : Manuellement pour chaque workflow**
```
1. Ouvrir un workflow
2. Cliquer sur "Workflow Settings" (⚙️)
3. Section "Error Workflow"
4. Sélectionner "JobNexAI - Error Handler Global"
5. Sauvegarder
```

**Méthode 2 : Automatiquement avec Watchdog**
```
1. Importer "Default Error Workflow Watchdog"
2. Modifier le node "Variables" :
   - default_error_workflow_id = ID du Error Handler
3. Activer le workflow
4. S'exécute tous les jours à 8h
5. Configure automatiquement tous les workflows
```

---

## 📊 Dashboard & Métriques

### **Requêtes SQL utiles**

#### **1. Erreurs récentes (24h)**
```sql
SELECT 
  workflow_name,
  node_name,
  severity,
  error_message,
  created_at
FROM workflow_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
```

#### **2. Statistiques par sévérité**
```sql
SELECT * FROM get_error_stats(7); -- 7 derniers jours
```

#### **3. Workflows les plus problématiques**
```sql
SELECT * FROM workflow_errors_summary
ORDER BY error_count DESC
LIMIT 10;
```

#### **4. Taux d'erreurs par workflow**
```sql
SELECT 
  workflow_name,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical,
  COUNT(*) FILTER (WHERE resolved = false) as unresolved,
  ROUND(AVG(CASE 
    WHEN severity = 'CRITICAL' THEN 4
    WHEN severity = 'HIGH' THEN 3
    WHEN severity = 'MEDIUM' THEN 2
    ELSE 1
  END), 2) as avg_severity_score
FROM workflow_errors
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY workflow_name
ORDER BY avg_severity_score DESC;
```

#### **5. Erreurs non résolues**
```sql
SELECT 
  workflow_name,
  severity,
  error_message,
  created_at,
  AGE(NOW(), created_at) as age
FROM workflow_errors
WHERE resolved = false
ORDER BY 
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    ELSE 4
  END,
  created_at ASC;
```

---

## 🔍 Debugging

### **Vérifier que le Error Handler fonctionne**

1. **Créer une erreur volontaire** :
   - Ouvrir un workflow de test
   - Ajouter un node HTTP Request avec URL invalide
   - Exécuter le workflow
   - Vérifier que l'erreur est loggée

2. **Vérifier dans Supabase** :
```sql
SELECT * FROM workflow_errors 
ORDER BY created_at DESC 
LIMIT 1;
```

3. **Vérifier dans N8N** :
   - Aller dans "Executions"
   - Filtrer par "Error Handler Global"
   - Voir les détails de l'exécution

---

## 🛠️ Résolution des Erreurs

### **Marquer une erreur comme résolue**

```sql
UPDATE workflow_errors
SET 
  resolved = true,
  resolved_at = NOW(),
  resolved_by = 'lionel',
  notes = 'Correction appliquée : ...'
WHERE id = 'UUID_DE_L_ERREUR';
```

### **Patterns d'erreurs courantes**

#### **1. Supabase Insert Failed**
```
Cause : Données mal formatées, contraintes violées
Solution : Vérifier mapping colonnes, valider données avant insert
```

#### **2. Mammouth.ai Timeout**
```
Cause : Requête trop longue, max_tokens trop élevé
Solution : Réduire max_tokens à 1000, simplifier prompt
```

#### **3. Rate Limit 429**
```
Cause : Trop de requêtes simultanées
Solution : Ajouter delays, Split In Batches, limiter concurrence
```

#### **4. JSON Parsing Failed**
```
Cause : Réponse IA mal formatée
Solution : Utiliser JSON Validator avec fallback
```

---

## 📈 Métriques Cibles

### **Production**
- **Taux d'erreurs** : <5% des exécutions
- **Erreurs critiques** : 0 par semaine
- **Temps de résolution** :
  - CRITICAL : <1h
  - HIGH : <24h
  - MEDIUM : <48h
  - LOW : <1 semaine

### **Alertes**
- **Slack** : Erreurs CRITICAL et HIGH uniquement
- **Email** : Résumé quotidien si >10 erreurs
- **Dashboard** : Métriques temps réel

---

## 🔄 Maintenance

### **Nettoyage automatique**

```sql
-- Supprimer erreurs résolues >30 jours
DELETE FROM workflow_errors
WHERE resolved = true
  AND resolved_at < NOW() - INTERVAL '30 days';

-- Archiver erreurs anciennes
CREATE TABLE workflow_errors_archive AS
SELECT * FROM workflow_errors
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM workflow_errors
WHERE created_at < NOW() - INTERVAL '90 days';
```

### **Monitoring hebdomadaire**

```sql
-- Rapport hebdomadaire
SELECT 
  DATE_TRUNC('day', created_at) as day,
  severity,
  COUNT(*) as error_count
FROM workflow_errors
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at), severity
ORDER BY day DESC, severity;
```

---

## 🎯 Prochaines Améliorations

1. **Dashboard Grafana** : Visualisation temps réel
2. **Auto-retry** : Retry automatique erreurs MEDIUM/LOW
3. **ML Prediction** : Prédiction erreurs avant qu'elles arrivent
4. **Integration Sentry** : Tracking avancé
5. **Alertes PagerDuty** : Escalation automatique

---

**Version** : 1.0  
**Date** : 03/10/2025  
**Auteur** : Cascade + Lionel  
**Projet** : JobNexAI - N8N Error Logging System
