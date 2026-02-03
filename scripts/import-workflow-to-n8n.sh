#!/bin/bash
# Import workflow into n8n via REST API
# Usage: ./scripts/import-workflow-to-n8n.sh <N8N_API_KEY>
#
# Requirements:
#   - curl and jq installed
#   - n8n accessible at https://n8n.jobnexai.com
#   - API key from n8n Settings > n8n API
#
# Get your API key:
#   1. Go to https://n8n.jobnexai.com/settings/api
#   2. Click "Create an API key" if none exists
#   3. Copy the key and pass it as argument

set -e

N8N_URL="https://n8n.jobnexai.com"
N8N_API_KEY="${1:-$N8N_API_KEY}"
WORKFLOW_FILE="$(dirname "$0")/../n8n-workflows/job-scraping-workflow.json"

if [ -z "$N8N_API_KEY" ]; then
  echo "Error: N8N_API_KEY is required"
  echo ""
  echo "Usage: $0 <API_KEY>"
  echo "  or: N8N_API_KEY=xxx $0"
  echo ""
  echo "Get your API key at: ${N8N_URL}/settings/api"
  exit 1
fi

if [ ! -f "$WORKFLOW_FILE" ]; then
  echo "Error: Workflow file not found: $WORKFLOW_FILE"
  exit 1
fi

echo "=== n8n Workflow Import ==="
echo "n8n URL: $N8N_URL"
echo "Workflow: $WORKFLOW_FILE"
echo ""

# Check n8n connectivity
echo "1. Checking n8n connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows?limit=1")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "Error: Cannot connect to n8n (HTTP $HTTP_STATUS)"
  echo "Check your API key and n8n URL"
  exit 1
fi
echo "   Connected successfully"

# Check if workflow already exists
echo "2. Checking for existing workflow..."
EXISTING=$(curl -s \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows" | jq -r '.data[] | select(.name == "JobNexAI - Multi-Source Job Scraping (Firecrawl + Ollama)") | .id')

if [ -n "$EXISTING" ]; then
  echo "   Found existing workflow (ID: $EXISTING)"
  echo "3. Updating existing workflow..."

  # Prepare workflow JSON (remove id and tags for update)
  WORKFLOW_BODY=$(jq 'del(.id, .tags, .versionId, .meta)' "$WORKFLOW_FILE")

  RESPONSE=$(curl -s -X PUT \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$WORKFLOW_BODY" \
    "$N8N_URL/api/v1/workflows/$EXISTING")

  WORKFLOW_ID="$EXISTING"
  echo "   Workflow updated (ID: $WORKFLOW_ID)"
else
  echo "   No existing workflow found"
  echo "3. Creating new workflow..."

  # Prepare workflow JSON (remove id and tags for creation)
  WORKFLOW_BODY=$(jq 'del(.id, .tags, .versionId, .meta)' "$WORKFLOW_FILE")

  RESPONSE=$(curl -s -X POST \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$WORKFLOW_BODY" \
    "$N8N_URL/api/v1/workflows")

  WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.id')

  if [ "$WORKFLOW_ID" = "null" ] || [ -z "$WORKFLOW_ID" ]; then
    echo "Error: Failed to create workflow"
    echo "Response: $RESPONSE"
    exit 1
  fi

  echo "   Workflow created (ID: $WORKFLOW_ID)"
fi

# Activate the workflow
echo "4. Activating workflow..."
curl -s -X POST \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID/activate" > /dev/null 2>&1

echo "   Workflow activated"

# Get webhook URL
echo ""
echo "=== Import Complete ==="
echo "Workflow ID: $WORKFLOW_ID"
echo "Workflow URL: ${N8N_URL}/workflow/$WORKFLOW_ID"
echo "Webhook URL: ${N8N_URL}/webhook/job-search"
echo ""
echo "Test with:"
echo "  curl -X POST ${N8N_URL}/webhook/job-search \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\": \"React Developer\", \"location\": \"Paris\"}'"
