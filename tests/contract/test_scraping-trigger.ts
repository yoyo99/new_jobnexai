// Contract test for scraping-trigger endpoint
// Tests the HTTP contract and API behavior

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { handler } from '../../netlify/functions/scraping-trigger';

describe('Scraping Trigger Contract Tests', () => {
  const validRequest = {
    userId: 'test-user-123',
    searchCriteria: {
      search: 'developer',
      location: 'Paris',
      jobType: 'full-time',
      experienceLevel: 'mid' as const
    },
    sources: ['indeed', 'linkedin'],
    priority: 'normal' as const
  };

  describe('POST /scraping-trigger', () => {
    it('should return 400 for missing userId', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.userId;

      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      } as any);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body || '{}');
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('MISSING_REQUIRED_FIELD');
    });

    it('should return 405 for non-POST requests', async () => {
      const response = await handler({
        httpMethod: 'GET',
        headers: {},
        body: null
      } as any);

      expect(response.statusCode).toBe(405);
    });

    it('should return 200 with valid scraping session response', async () => {
      // Mock the dependencies
      const mockResponse = {
        sessionId: 'test-session-123',
        status: 'triggered' as const,
        message: 'Scraping workflow triggered successfully',
        estimatedDuration: 180,
        webhookUrl: 'https://test.webhook.url'
      };

      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest)
      } as any);

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
      
      const body = JSON.parse(response.body || '{}');
      expect(body.sessionId).toBeDefined();
      expect(body.status).toMatch(/triggered|queued/);
      expect(body.message).toBeDefined();
    });

    it('should handle CORS preflight requests', async () => {
      const response = await handler({
        httpMethod: 'OPTIONS',
        headers: { 'Origin': 'https://test.com' },
        body: null
      } as any);

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
    });

    it('should validate search criteria structure', async () => {
      const invalidRequest = {
        ...validRequest,
        searchCriteria: {
          invalidField: 'value'
        }
      };

      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      } as any);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body || '{}');
      expect(body.error).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      } as any);

      expect(response.statusCode).toBe(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle n8n webhook failures gracefully', async () => {
      // Mock n8n service failure
      const requestWithInvalidSource = {
        ...validRequest,
        sources: ['non-existent-source']
      };

      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithInvalidSource)
      } as any);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body || '{}');
      expect(body.error).toBeDefined();
      expect(body.error.type).toBe('n8n_error');
    });

    it('should handle database connection failures', async () => {
      // This would require mocking database failures
      // For now, ensure error structure is consistent
      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          userId: 'trigger-db-error'
        })
      } as any);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body || '{}');
      expect(body.error).toBeDefined();
      expect(body.error.type).toBe('database_error');
    });
  });

  describe('Response Format', () => {
    it('should return consistent error response format', async () => {
      const response = await handler({
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      } as any);

      const body = JSON.parse(response.body || '{}');
      
      if (response.statusCode >= 400) {
        expect(body.error).toBeDefined();
        expect(body.error.code).toBeDefined();
        expect(body.error.message).toBeDefined();
        expect(body.error.type).toBeDefined();
        expect(body.error.retryable).toBeDefined();
      }
    });

    it('should include CORS headers in all responses', async () => {
      const testCases = [
        { httpMethod: 'POST', body: '{}' },
        { httpMethod: 'GET', body: null },
        { httpMethod: 'OPTIONS', body: null }
      ];

      for (const testCase of testCases) {
        const response = await handler(testCase as any);
        expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
        expect(response.headers).toHaveProperty('Access-Control-Allow-Headers');
        expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
      }
    });
  });
});
