import { NextRequest } from 'next/server'
import { POST } from '../../../app/api/pole-emploi/route'
import { generatePoleEmploiDocument } from '../../../app/api/pole-emploi/utils'

// Mock the document generation
jest.mock('../../../app/api/pole-emploi/utils', () => ({
  generatePoleEmploiDocument: jest.fn().mockResolvedValue(new ArrayBuffer(8))
}))

// Mock Redis and S3
jest.mock('../../../lib/redisClient', () => ({
  getRedisClient: jest.fn(() => null)
}))

jest.mock('../../../lib/s3', () => ({
  getS3ObjectBuffer: jest.fn(),
  uploadDocumentToS3: jest.fn()
}))

describe('POST /api/pole-emploi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return 400 for invalid payload', async () => {
    const invalidPayload = {
      user_info: {
        // Missing required fields
        lastname: 'Doe'
      },
      period: [1], // Invalid period
      summary: {
        // Missing applications
      }
    }

    const request = new NextRequest('http://localhost/api/pole-emploi', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Requête invalide')
    expect(data.details).toBeDefined()
    expect(data.details.length).toBeGreaterThan(0)
  })

  test('should return 400 for missing user_info', async () => {
    const invalidPayload = {
      period: [1, 2023],
      summary: {
        applications: []
      }
    }

    const request = new NextRequest('http://localhost/api/pole-emploi', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('user_info')
  })

  test('should return 400 for invalid period format', async () => {
    const invalidPayload = {
      user_info: {
        lastname: 'Doe',
        firstname: 'John',
        address: '123 Main St',
        pole_emploi_id: '123456'
      },
      period: [1], // Should be [number, number]
      summary: {
        applications: []
      }
    }

    const request = new NextRequest('http://localhost/api/pole-emploi', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('period')
  })

  test('should return 200 for valid payload', async () => {
    const validPayload = {
      user_info: {
        lastname: 'Doe',
        firstname: 'John',
        address: '123 Main St',
        pole_emploi_id: '123456'
      },
      period: [1, 2023],
      summary: {
        applications: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            date: '2023-01-15',
            status: 'applied'
          }
        ]
      },
      template_type: 'standard'
    }

    const request = new NextRequest('http://localhost/api/pole-emploi', {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(generatePoleEmploiDocument).toHaveBeenCalledWith(validPayload)
  })

  test('should return 400 for empty payload', async () => {
    const request = new NextRequest('http://localhost/api/pole-emploi', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Requête invalide')
    expect(data.details).toBeDefined()
  })

  test('should return 400 for non-object payload', async () => {
    const request = new NextRequest('http://localhost/api/pole-emploi', {
      method: 'POST',
      body: JSON.stringify('invalid'),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Requête invalide')
  })
})