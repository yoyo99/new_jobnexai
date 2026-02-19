/**
 * N8N Auth stub (local copy for src/)
 */

export interface N8nWebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp?: string;
}

export async function triggerN8nWorkflow(
  _webhookUrl: string, 
  _payload: N8nWebhookPayload
): Promise<{ success: boolean }> {
  console.warn('[n8n-auth] triggerN8nWorkflow called - stub implementation');
  return { success: true };
}
