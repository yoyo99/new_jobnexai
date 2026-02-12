# JobNexAI - CV Screening avec Mammouth.ai

## 📊 Overview

- **Nombre de nœuds**: 20
- **Score de complexité**: 116/100
- **Triggers**: 1
- **Actions**: 19
- **Intégrations**: Supabase, HTTP, Mammouth.ai

## 🔧 Nodes

### Triggers

- **Form Trigger - Upload CV**

### Actions

- **Extract - CV PDF**
- **HTTP - Fetch Job Description**
- **Set - Merge CV + Job**
- **Prepare Mammouth Request**
- **Mammouth.ai - CV Analysis**
- **Set - Extract AI Response**
- **Function - JSON Validator**
- **Supabase - Save Analysis**
- **HTTP Request**
- **Code in JavaScript**
- **If**
- **Merge**
- **Merge CV + Job Data**
- **Debug - Check Email**
- **Add Email to CV Data**
- **Merge Email + Analysis Data**
- **Supabase - Get User Language**
- **Code - Extract and Merge AI Response**
- **Code - Fetch Job Description**

## 🔍 Analyse Technique

### Types de nœuds

- **n8n-nodes-base.formTrigger**: 1 nœud(s)
- **n8n-nodes-base.extractFromFile**: 1 nœud(s)
- **n8n-nodes-base.httpRequest**: 3 nœud(s)
- **n8n-nodes-base.set**: 3 nœud(s)
- **n8n-nodes-base.code**: 8 nœud(s)
- **n8n-nodes-base.supabase**: 2 nœud(s)
- **n8n-nodes-base.if**: 1 nœud(s)
- **n8n-nodes-base.merge**: 1 nœud(s)

### Variables utilisées

- `{{ $('Form Trigger - Upload CV').first().json.url_de_l_offre_d_emploi }}`
- `{{ $item(0).json.cv_text || $item(0).json.text }}`
- `{{ $item(0).json.votre_email }}`
- `{{ $item(1).json.job_text || $item(1).json.data }}`
- `{{ $item(1).json.job_url }}`
- `{{ $json }}`
- `{{ $json.analyzed_at }}`
- `{{ $json.candidate_name }}`
- `{{ $json.choices[0].message.content }}`
- `{{ $json.data }}`
- `{{ $json.job_url }}`
- `{{ $json.mammouthPayload }}`
- `{{ $json.matching_score }}`
- `{{ $json.user_email }}`
- `{{ $json.validation_status }}`
- `{{ $json.votre_email }}`
- `{{ $node[\"Function - JSON Validator\"].json.candidate_name }}`
- `{{ $node[\"Function - JSON Validator\"].json.interview_questions }}`
- `{{ $node[\"Function - JSON Validator\"].json.job_url }}`
- `{{ $node[\"Function - JSON Validator\"].json.key_insights }}`
- `{{ $node[\"Function - JSON Validator\"].json.matching_score }}`
- `{{ $node[\"Function - JSON Validator\"].json.recommendation }}`
- `{{ $node[\"Function - JSON Validator\"].json.strengths }}`
- `{{ $node[\"Function - JSON Validator\"].json.user_email }}`
- `{{ $node[\"Function - JSON Validator\"].json.weaknesses }}`
- `{{ $node[\"Merge CV + Job Data\"].json.cv_text }}`
- `{{ $node[\"Merge CV + Job Data\"].json.job_data }}`
- `{{ $node[\"Merge CV + Job Data\"].json.job_url }}`
- `{{ $node[\"Merge CV + Job Data\"].json.user_email }}`
- `{{ JSON.parse($json.choices[0].message.content).candidate_name }}`
- `{{ JSON.parse($json.choices[0].message.content).interview_questions }}`
- `{{ JSON.parse($json.choices[0].message.content).key_insights }}`
- `{{ JSON.parse($json.choices[0].message.content).matching_score }}`
- `{{ JSON.parse($json.choices[0].message.content).recommendation }}`
- `{{ JSON.parse($json.choices[0].message.content).strengths }}`
- `{{ JSON.parse($json.choices[0].message.content).weaknesses }}`
- `{{ new Date().toISOString() }}`

### Intégrations

- ✅ HTTP
- ✅ Mammouth.ai
- ✅ Supabase

## 📝 Détails du Workflow

### 1. Form Trigger - Upload CV

- **Type**: `n8n-nodes-base.formTrigger`
- **ID**: `7e5025f9-521b-42fd-a520-faa672b656dd`
- **Position**: [-944, 432]

### 2. Extract - CV PDF

- **Type**: `n8n-nodes-base.extractFromFile`
- **ID**: `ce74b2df-8e5d-4a2b-8edf-bf06a1a4b098`
- **Position**: [-592, 432]

### 3. HTTP - Fetch Job Description

- **Type**: `n8n-nodes-base.httpRequest`
- **ID**: `fe1401ca-f76d-4859-886e-c1d6933401dc`
- **Position**: [672, 16]

### 4. Set - Merge CV + Job

- **Type**: `n8n-nodes-base.set`
- **ID**: `b2c90f64-4276-4d4a-a9be-5fa169a9ed9c`
- **Position**: [0, 0]

### 5. Prepare Mammouth Request

- **Type**: `n8n-nodes-base.code`
- **ID**: `73e64912-e15e-4115-af0b-241e3712f65c`
- **Position**: [336, 432]

### 6. Mammouth.ai - CV Analysis

- **Type**: `n8n-nodes-base.httpRequest`
- **ID**: `669b29b5-3fb2-4299-aabb-e33fca355bdb`
- **Position**: [528, 432]

### 7. Set - Extract AI Response

- **Type**: `n8n-nodes-base.set`
- **ID**: `f4018793-3480-43b2-b0e2-06657dc3c2db`
- **Position**: [336, 16]

### 8. Function - JSON Validator

- **Type**: `n8n-nodes-base.code`
- **ID**: `0c233236-e717-453a-8040-9ceecf6e56c1`
- **Position**: [944, 432]

### 9. Supabase - Save Analysis

- **Type**: `n8n-nodes-base.supabase`
- **ID**: `9aa4933e-2213-4840-aee8-989a4625fa1c`
- **Position**: [1936, 448]

### 10. HTTP Request

- **Type**: `n8n-nodes-base.httpRequest`
- **ID**: `932d471d-f268-419a-aa95-9b10566ea4e0`
- **Position**: [1520, 448]

### 11. Code in JavaScript

- **Type**: `n8n-nodes-base.code`
- **ID**: `f28444e2-3454-4d0a-b455-c86a04d39ab7`
- **Position**: [-720, 800]

### 12. If

- **Type**: `n8n-nodes-base.if`
- **ID**: `973b8fd6-18aa-46ec-95ed-f4a2482278c8`
- **Position**: [1136, 432]

### 13. Merge

- **Type**: `n8n-nodes-base.merge`
- **ID**: `8e2a37db-07d7-44f1-b968-78c855f32fbb`
- **Position**: [-240, 640]

### 14. Merge CV + Job Data

- **Type**: `n8n-nodes-base.code`
- **ID**: `be57989c-a724-4be6-b761-b4d0a00bb527`
- **Position**: [128, 432]

### 15. Debug - Check Email

- **Type**: `n8n-nodes-base.code`
- **ID**: `68258196-08ce-4b00-9ad9-cc9badd6bddd`
- **Position**: [1344, 352]

### 16. Add Email to CV Data

- **Type**: `n8n-nodes-base.code`
- **ID**: `d7fd4577-9ad6-4faf-a687-b3f2952a073b`
- **Position**: [-368, 416]

### 17. Merge Email + Analysis Data

- **Type**: `n8n-nodes-base.set`
- **ID**: `010ec31c-fe43-40c0-b278-3a6eac3e27b6`
- **Position**: [1728, 448]

### 18. Supabase - Get User Language

- **Type**: `n8n-nodes-base.supabase`
- **ID**: `e45615a5-969b-4636-af2c-8780c0ec0b42`
- **Position**: [-48, 432]

### 19. Code - Extract and Merge AI Response

- **Type**: `n8n-nodes-base.code`
- **ID**: `9fc67b0a-1d65-4502-a2cf-b78ae965db47`
- **Position**: [736, 432]

### 20. Code - Fetch Job Description

- **Type**: `n8n-nodes-base.code`
- **ID**: `cbd3874b-95eb-4196-b054-ba3461de4bf9`
- **Position**: [-912, 800]

