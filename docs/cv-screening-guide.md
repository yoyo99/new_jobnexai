# 🎯 CV SCREENING AVEC MAMMOUTH.AI - GUIDE COMPLET

## 📋 Vue d'ensemble

Le workflow CV Screening analyse automatiquement un CV et une offre d'emploi pour générer :
- **Matching Score** (0-100)
- **Forces/Faiblesses** du candidat
- **Compétences** matched/missing
- **Recommandation** finale
- **Questions d'entretien** pertinentes

---

## 🏗️ Architecture

```
Form Upload → Extract PDF → Fetch Job → Mammouth.ai Analysis → Validation → Supabase
```

**Durée** : 10-30 secondes par analyse

---

## 🚀 Installation

### **1. Créer la table Supabase**

```bash
# Exécuter la migration
psql -h klwugophjvzctlautsqz.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20251003_create_cv_analyses_table.sql
```

Ou via Supabase SQL Editor :
```sql
-- Copier/coller le contenu de la migration
```

### **2. Importer le workflow dans N8N**

1. Ouvrir N8N : http://VOTRE_IP:5678
2. Add Workflow → Import from File
3. Sélectionner `cv-screening-mammouth.json`
4. Configurer credentials :
   - Mammouth.ai (déjà configuré)
   - Supabase (déjà configuré)

### **3. Activer le workflow**

1. Ouvrir le workflow
2. Cliquer "Active" (toggle en haut)
3. Copier l'URL du form

**URL du form** : `http://VOTRE_IP:5678/form/cv-screening-form`

---

## 📝 Utilisation

### **Méthode 1 : Form Public**

1. **Partager l'URL** du form aux candidats
2. **Candidat remplit** :
   - Upload CV (PDF)
   - URL offre d'emploi
   - Email
3. **Analyse automatique** en 10-30s
4. **Résultats** sauvegardés dans Supabase

### **Méthode 2 : API Directe**

```bash
curl -X POST http://VOTRE_IP:5678/webhook/cv-screening \
  -F "cv=@/path/to/cv.pdf" \
  -F "job_url=https://example.com/job" \
  -F "email=candidat@example.com"
```

### **Méthode 3 : Intégration Frontend**

```typescript
// Dans JobNexAI frontend
const analyzCV = async (cvFile: File, jobUrl: string, email: string) => {
  const formData = new FormData();
  formData.append('cv', cvFile);
  formData.append('job_url', jobUrl);
  formData.append('email', email);
  
  const response = await fetch('http://VOTRE_IP:5678/form/cv-screening-form', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

---

## 📊 Résultats de l'Analyse

### **Structure JSON**

```json
{
  "matching_score": 85,
  "strengths": [
    "5 ans d'expérience React/TypeScript",
    "Expertise architecture microservices",
    "Contributions open-source significatives"
  ],
  "weaknesses": [
    "Manque d'expérience Kubernetes",
    "Pas de certification AWS"
  ],
  "skills_match": {
    "matched": ["React", "TypeScript", "Node.js", "PostgreSQL"],
    "missing": ["Kubernetes", "AWS", "Docker Swarm"]
  },
  "experience_match": {
    "level": "senior",
    "years": 5,
    "relevant": true
  },
  "recommendation": "Candidat très prometteur avec une excellente maîtrise du stack technique principal. Les compétences manquantes (Kubernetes, AWS) peuvent être acquises rapidement. Recommandation : Entretien technique approfondi.",
  "key_insights": [
    "Profil senior avec expertise prouvée",
    "Bon fit culturel (open-source)",
    "Formation nécessaire sur cloud AWS"
  ],
  "interview_questions": [
    "Pouvez-vous décrire votre architecture microservices la plus complexe ?",
    "Comment gérez-vous le scaling d'une application React ?",
    "Quelle est votre expérience avec les CI/CD pipelines ?"
  ]
}
```

---

## 🔍 Requêtes SQL Utiles

### **1. Analyses récentes**

```sql
SELECT 
  user_email,
  job_title,
  job_company,
  matching_score,
  analyzed_at
FROM cv_analyses
ORDER BY analyzed_at DESC
LIMIT 20;
```

### **2. Meilleurs matchs**

```sql
SELECT 
  user_email,
  job_title,
  matching_score,
  recommendation
FROM cv_analyses
WHERE matching_score >= 80
ORDER BY matching_score DESC;
```

### **3. Statistiques par candidat**

```sql
SELECT * FROM get_cv_stats('candidat@example.com');
```

### **4. Top compétences demandées**

```sql
SELECT 
  skill,
  COUNT(*) as frequency
FROM cv_analyses,
  jsonb_array_elements_text(skills_match->'missing') as skill
GROUP BY skill
ORDER BY frequency DESC
LIMIT 10;
```

### **5. Matching automatique jobs**

```sql
-- Trouver jobs correspondant aux compétences d'un CV
SELECT * FROM find_matching_jobs(
  '["React", "TypeScript", "Node.js", "PostgreSQL"]'::jsonb,
  60  -- Score minimum
);
```

---

## 🎨 Intégration Frontend

### **Composant React**

```tsx
import { useState } from 'react';

export function CVScreening() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('cv', cvFile!);
    formData.append('job_url', jobUrl);
    formData.append('email', email);

    try {
      const response = await fetch('http://VOTRE_IP:5678/form/cv-screening-form', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erreur analyse CV:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-screening">
      <h2>Analyse de CV</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          required
        />
        
        <input
          type="url"
          placeholder="URL de l'offre d'emploi"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          required
        />
        
        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Analyse en cours...' : 'Analyser'}
        </button>
      </form>

      {result && (
        <div className="results">
          <h3>Résultats</h3>
          <div className="score">
            Score de matching : {result.matching_score}/100
          </div>
          
          <div className="strengths">
            <h4>Points forts</h4>
            <ul>
              {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          
          <div className="recommendation">
            <h4>Recommandation</h4>
            <p>{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Configuration Avancée

### **Personnaliser le prompt**

Éditer le node "Mammouth.ai - CV Analysis" :

```javascript
// Modifier le system prompt pour adapter l'analyse
{
  "role": "system",
  "content": "Tu es un expert RH spécialisé en [VOTRE_DOMAINE]..."
}
```

### **Ajouter des critères**

```javascript
// Ajouter des champs dans la réponse JSON
{
  "cultural_fit": "high|medium|low",
  "salary_expectation": "compatible|negotiable|too_high",
  "availability": "immediate|1_month|3_months"
}
```

### **Notification Email**

Ajouter un node "Send Email" après Supabase :

```javascript
// Node Gmail ou SendGrid
{
  "to": "{{ $json.user_email }}",
  "subject": "Résultats analyse CV - {{ $json.job_title }}",
  "body": "Votre score de matching : {{ $json.matching_score }}/100..."
}
```

---

## 📈 Métriques & Analytics

### **Dashboard Supabase**

```sql
-- Vue d'ensemble
SELECT 
  COUNT(*) as total_analyses,
  ROUND(AVG(matching_score), 2) as avg_score,
  COUNT(*) FILTER (WHERE matching_score >= 80) as excellent,
  COUNT(*) FILTER (WHERE matching_score >= 60) as good,
  COUNT(*) FILTER (WHERE matching_score < 60) as poor
FROM cv_analyses
WHERE analyzed_at > NOW() - INTERVAL '30 days';
```

### **Graphiques recommandés**

1. **Distribution scores** : Histogramme 0-100
2. **Analyses par jour** : Line chart
3. **Top compétences** : Bar chart
4. **Taux de matching** : Pie chart

---

## 🚨 Troubleshooting

### **Problème 1 : PDF non extrait**

```bash
# Vérifier format PDF
file cv.pdf

# Si PDF corrompu, reconvertir
gs -sDEVICE=pdfwrite -o cv_fixed.pdf cv.pdf
```

### **Problème 2 : Job URL non accessible**

```bash
# Tester URL manuellement
curl -I https://example.com/job

# Si 403/401, ajouter User-Agent
```

### **Problème 3 : Mammouth.ai timeout**

```javascript
// Réduire max_tokens
{
  "max_tokens": 1500  // Au lieu de 2000
}
```

### **Problème 4 : JSON invalide**

Le Function Validator devrait gérer automatiquement.

Si ça persiste :
```javascript
// Vérifier logs
console.log('AI Response:', aiResponse);
```

---

## 🎯 Cas d'Usage

### **1. Pré-screening automatique**

```
Candidat postule → Upload CV → Analyse auto → Score < 60 = Rejet poli
```

### **2. Matching jobs existants**

```sql
-- Trouver jobs correspondant au CV
SELECT * FROM find_matching_jobs(
  (SELECT skills_match->'matched' FROM cv_analyses WHERE id = 'UUID'),
  70
);
```

### **3. Recommandations personnalisées**

```
Analyse CV → Extraire compétences → Matching jobs DB → Email recommandations
```

### **4. Analytics recrutement**

```sql
-- Compétences les plus demandées
SELECT skill, COUNT(*) 
FROM cv_analyses, jsonb_array_elements_text(skills_match->'missing') skill
GROUP BY skill
ORDER BY count DESC;
```

---

## 🔐 Sécurité

### **1. Validation fichiers**

```javascript
// Vérifier taille et type
if (file.size > 5 * 1024 * 1024) {
  throw new Error('CV trop volumineux (max 5MB)');
}

if (!file.name.endsWith('.pdf')) {
  throw new Error('Format PDF uniquement');
}
```

### **2. Rate limiting**

```javascript
// Limiter analyses par email
const count = await supabase
  .from('cv_analyses')
  .select('count')
  .eq('user_email', email)
  .gte('analyzed_at', new Date(Date.now() - 24*60*60*1000));

if (count > 5) {
  throw new Error('Limite quotidienne atteinte (5 analyses/jour)');
}
```

### **3. Sanitization**

```javascript
// Nettoyer inputs
const sanitizedEmail = email.toLowerCase().trim();
const sanitizedUrl = new URL(jobUrl).toString();
```

---

## 💡 Améliorations Futures

1. **Vector Similarity** : Matching sémantique avec embeddings
2. **Multi-langue** : Support CV en anglais, espagnol, etc.
3. **Parsing avancé** : Extraction structurée (diplômes, expériences)
4. **Scoring ML** : Modèle entraîné sur données historiques
5. **Interview Scheduling** : Intégration Calendly
6. **Video Analysis** : Analyse vidéo de présentation

---

**Version** : 1.0  
**Date** : 03/10/2025  
**Auteur** : Cascade + Lionel  
**Projet** : JobNexAI - CV Screening avec Mammouth.ai
