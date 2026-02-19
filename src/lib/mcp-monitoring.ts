/**
 * MCP Monitoring stub (local copy for src/)
 */

export async function trackSessionStart(
  _sessionId: string, 
  _metadata?: Record<string, any>
): Promise<void> {
  console.debug('[mcp-monitoring] trackSessionStart - stub');
}

export async function sendPerformanceAlert(
  _metric: string, 
  _value: number, 
  _threshold?: number
): Promise<void> {
  console.debug('[mcp-monitoring] sendPerformanceAlert - stub');
}

export async function sendErrorAlert(
  _error: string, 
  _context?: Record<string, any>
): Promise<void> {
  console.debug('[mcp-monitoring] sendErrorAlert - stub');
}
