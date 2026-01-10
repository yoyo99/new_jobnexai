import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { ScrapingService } from '../../src/lib/scraping-service-impl';
import { ScrapingTriggerRequest, ScrapingTriggerResponse } from '../../src/lib/scraping-service';
import { errorHandler, createValidationError, createAuthError } from './lib/error-handler';
import { createLogger } from './lib/logger';

// Initialize services
const logger = createLogger('scraping-trigger');
const scrapingService = new ScrapingService();

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Main handler function
const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return errorHandler.createErrorResponse(
      createValidationError('Only POST method is allowed', 'httpMethod')
    );
  }

  try {
    // Parse and validate request body
    const requestBody: ScrapingTriggerRequest = parseRequestBody(event.body);
    
    // Validate required fields
    validateRequest(requestBody);
    
    // Trigger scraping workflow
    const response = await scrapingService.triggerScraping(requestBody);
    
    logger.info('Scraping triggered successfully', {
      sessionId: response.sessionId,
      status: response.status
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response)
    };

  } catch (error) {
    logger.error('Scraping trigger failed', error as Error);
    
    return errorHandler.createErrorResponse(error);
  }
};

// Helper function to parse request body
function parseRequestBody(body: string | null): ScrapingTriggerRequest {
  if (!body) {
    throw createValidationError('Request body is required');
  }

  try {
    return JSON.parse(body);
  } catch (parseError) {
    throw createValidationError('Invalid JSON in request body');
  }
}

// Helper function to validate request
function validateRequest(request: ScrapingTriggerRequest): void {
  if (!request.userId) {
    throw createValidationError('Missing required field: userId', 'userId');
  }

  if (!request.searchCriteria) {
    throw createValidationError('Missing required field: searchCriteria', 'searchCriteria');
  }

  // Validate search criteria structure
  const criteria = request.searchCriteria;
  if (typeof criteria !== 'object' || criteria === null) {
    throw createValidationError('searchCriteria must be an object', 'searchCriteria');
  }

  // Validate specific search criteria fields if provided
  if (criteria.experienceLevel && !['junior', 'mid', 'senior', 'not_specified'].includes(criteria.experienceLevel)) {
    throw createValidationError(
      'experienceLevel must be one of: junior, mid, senior, not_specified',
      'experienceLevel'
    );
  }

  if (criteria.priority && !['low', 'normal', 'high'].includes(criteria.priority)) {
    throw createValidationError(
      'priority must be one of: low, normal, high',
      'priority'
    );
  }
}

export { handler };
