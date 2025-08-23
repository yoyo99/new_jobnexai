# JobNexAI API Documentation

Welcome to the JobNexAI API documentation. This guide provides comprehensive information about all available endpoints, authentication methods, request/response formats, and usage examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL & Headers](#base-url--headers)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [User Profile Endpoints](#user-profile-endpoints)
   - [Job Search Endpoints](#job-search-endpoints)
   - [Job Application Endpoints](#job-application-endpoints)
   - [CV/Resume Endpoints](#cv-resume-endpoints)
   - [Skills & Matching Endpoints](#skills--matching-endpoints)
   - [Subscription & Billing Endpoints](#subscription--billing-endpoints)
   - [Notification Endpoints](#notification-endpoints)
6. [Webhooks](#webhooks)
7. [SDK Libraries](#sdk-libraries)
8. [Examples](#examples)

## Authentication

JobNexAI uses JWT (JSON Web Tokens) for authentication. All API requests must include a valid JWT token in the Authorization header.

### Getting an Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Using the Access Token

Include the token in the Authorization header for all API requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Base URL & Headers

**Production:** `https://api.jobnexai.com`
**Staging:** `https://staging-api.jobnexai.com`

### Required Headers

```http
Content-Type: application/json
Authorization: Bearer {your_jwt_token}
User-Agent: YourApp/1.0
```

### Optional Headers

```http
X-Request-ID: {unique_request_id}
Accept-Language: en-US,en;q=0.9
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided email address is invalid",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "request_id": "req_123456789"
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or expired token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SUBSCRIPTION_REQUIRED` | Premium subscription needed |
| `MAINTENANCE_MODE` | API temporarily unavailable |

## Rate Limiting

API requests are limited based on your subscription plan:

| Plan | Requests per minute | Requests per hour |
|------|-------------------|------------------|
| Free | 100 | 1,000 |
| Pro | 500 | 10,000 |
| Enterprise | 2,000 | 50,000 |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password123",
  "full_name": "John Doe",
  "user_type": "job_seeker" // or "recruiter"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "job_seeker",
    "email_verified": false,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Registration successful. Please check your email for verification."
}
```

#### Login User
```http
POST /api/auth/login
```

#### Logout User
```http
POST /api/auth/logout
```

#### Verify Email
```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
```

### User Profile Endpoints

#### Get User Profile
```http
GET /api/user/profile
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "job_seeker",
    "avatar_url": "https://cdn.jobnexai.com/avatars/123.jpg",
    "location": "San Francisco, CA",
    "bio": "Experienced software developer...",
    "phone": "+1-555-0123",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "github_url": "https://github.com/johndoe",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expires_at": "2024-02-15T10:30:00Z"
    }
  }
}
```

#### Update User Profile
```http
PUT /api/user/profile
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "location": "New York, NY",
  "bio": "Senior software engineer with 8+ years...",
  "phone": "+1-555-0456",
  "linkedin_url": "https://linkedin.com/in/johnsmith"
}
```

#### Upload Avatar
```http
POST /api/user/avatar
Content-Type: multipart/form-data
```

**Request Body:**
```
avatar: [binary file data]
```

#### Get User Skills
```http
GET /api/user/skills
```

**Response:** `200 OK`
```json
{
  "skills": [
    {
      "id": "skill_123",
      "name": "JavaScript",
      "category": "Programming Languages",
      "proficiency_level": 4,
      "years_experience": 5,
      "verified": true,
      "added_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15
}
```

#### Add User Skill
```http
POST /api/user/skills
```

**Request Body:**
```json
{
  "skill_name": "React",
  "category": "Frontend Frameworks",
  "proficiency_level": 4,
  "years_experience": 3
}
```

### Job Search Endpoints

#### Search Jobs
```http
GET /api/jobs/search
```

**Query Parameters:**
- `q` (string): Search query
- `location` (string): Location filter
- `job_type` (string): Job type filter (full_time, part_time, contract)
- `remote_type` (string): Remote work type (remote, hybrid, onsite)
- `salary_min` (number): Minimum salary
- `salary_max` (number): Maximum salary
- `experience_level` (string): Experience level (junior, mid, senior)
- `company_size` (string): Company size filter
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)
- `sort_by` (string): Sort order (date, salary, relevance)

**Example:**
```http
GET /api/jobs/search?q=software engineer&location=San Francisco&remote_type=remote&salary_min=100000&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Senior Software Engineer",
      "company": "TechCorp Inc.",
      "company_logo": "https://cdn.jobnexai.com/logos/techcorp.png",
      "location": "San Francisco, CA",
      "remote_type": "remote",
      "job_type": "full_time",
      "experience_level": "senior",
      "salary_min": 120000,
      "salary_max": 180000,
      "currency": "USD",
      "description": "We are looking for a senior software engineer...",
      "required_skills": ["JavaScript", "React", "Node.js"],
      "preferred_skills": ["TypeScript", "GraphQL"],
      "posted_at": "2024-01-20T09:00:00Z",
      "expires_at": "2024-02-20T09:00:00Z",
      "url": "https://techcorp.com/jobs/senior-software-engineer",
      "match_score": 85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "applied": {
      "q": "software engineer",
      "location": "San Francisco",
      "remote_type": "remote"
    },
    "available": {
      "locations": ["San Francisco", "New York", "Remote"],
      "companies": ["TechCorp", "StartupXYZ"],
      "skills": ["JavaScript", "Python", "React"]
    }
  }
}
```

#### Get Job Details
```http
GET /api/jobs/{job_id}
```

**Response:** `200 OK`
```json
{
  "job": {
    "id": "job_123",
    "title": "Senior Software Engineer",
    "company": "TechCorp Inc.",
    "company_details": {
      "name": "TechCorp Inc.",
      "description": "Leading technology company...",
      "size": "500-1000",
      "industry": "Technology",
      "website": "https://techcorp.com",
      "logo": "https://cdn.jobnexai.com/logos/techcorp.png"
    },
    "location": "San Francisco, CA",
    "remote_type": "remote",
    "job_type": "full_time",
    "experience_level": "senior",
    "salary_min": 120000,
    "salary_max": 180000,
    "currency": "USD",
    "description": "Full detailed job description...",
    "responsibilities": [
      "Design and develop scalable web applications",
      "Collaborate with cross-functional teams"
    ],
    "requirements": [
      "5+ years of software development experience",
      "Strong knowledge of JavaScript and React"
    ],
    "benefits": [
      "Health insurance",
      "401k matching",
      "Flexible PTO"
    ],
    "required_skills": ["JavaScript", "React", "Node.js"],
    "preferred_skills": ["TypeScript", "GraphQL"],
    "posted_at": "2024-01-20T09:00:00Z",
    "expires_at": "2024-02-20T09:00:00Z",
    "url": "https://techcorp.com/jobs/senior-software-engineer",
    "application_count": 45,
    "match_score": 85,
    "similar_jobs": ["job_124", "job_125"]
  }
}
```

#### Get Job Recommendations
```http
GET /api/jobs/recommendations
```

**Query Parameters:**
- `limit` (number): Number of recommendations (default: 10, max: 50)

### Job Application Endpoints

#### Get User Applications
```http
GET /api/applications
```

**Query Parameters:**
- `status` (string): Filter by status
- `page` (number): Page number
- `limit` (number): Results per page

**Response:** `200 OK`
```json
{
  "applications": [
    {
      "id": "app_123",
      "job_id": "job_123",
      "status": "applied",
      "applied_at": "2024-01-20T10:30:00Z",
      "notes": "Applied through company website",
      "next_step_date": "2024-01-25T14:00:00Z",
      "next_step_type": "phone",
      "job": {
        "id": "job_123",
        "title": "Senior Software Engineer",
        "company": "TechCorp Inc."
      },
      "timeline": [
        {
          "date": "2024-01-20T10:30:00Z",
          "status": "applied",
          "description": "Application submitted"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

#### Create Job Application
```http
POST /api/applications
```

**Request Body:**
```json
{
  "job_id": "job_123",
  "cover_letter": "I am excited to apply for this position...",
  "cv_id": "cv_456",
  "notes": "Applied through JobNexAI"
}
```

#### Update Application Status
```http
PUT /api/applications/{application_id}
```

**Request Body:**
```json
{
  "status": "interviewing",
  "notes": "Phone interview scheduled",
  "next_step_date": "2024-01-25T14:00:00Z",
  "next_step_type": "phone"
}
```

### CV/Resume Endpoints

#### Get User CVs
```http
GET /api/cv
```

#### Upload CV
```http
POST /api/cv/upload
Content-Type: multipart/form-data
```

**Request Body:**
```
file: [PDF/DOC file]
name: "John Doe - Software Engineer"
is_primary: true
```

#### Generate CV
```http
POST /api/cv/generate
```

**Request Body:**
```json
{
  "template": "modern",
  "sections": {
    "personal_info": true,
    "summary": true,
    "experience": true,
    "education": true,
    "skills": true,
    "projects": true
  },
  "job_id": "job_123" // Optional: optimize for specific job
}
```

#### Optimize CV for Job
```http
POST /api/cv/optimize
```

**Request Body:**
```json
{
  "cv_id": "cv_123",
  "job_id": "job_456"
}
```

### Skills & Matching Endpoints

#### Analyze Job Match
```http
POST /api/matching/analyze
```

**Request Body:**
```json
{
  "job_id": "job_123"
}
```

**Response:** `200 OK`
```json
{
  "match_analysis": {
    "overall_score": 85,
    "matching_skills": [
      {
        "skill": "JavaScript",
        "user_level": 4,
        "required_level": 3,
        "match": "strong"
      }
    ],
    "missing_skills": [
      {
        "skill": "GraphQL",
        "importance": "preferred",
        "recommendation": "Consider learning GraphQL to strengthen your application"
      }
    ],
    "recommendations": [
      "Your JavaScript skills are a strong match",
      "Consider highlighting your React experience",
      "Learning GraphQL would make you an even stronger candidate"
    ],
    "skill_gaps": {
      "critical": [],
      "important": ["GraphQL"],
      "nice_to_have": ["Docker"]
    }
  }
}
```

#### Get Skill Suggestions
```http
GET /api/skills/suggestions
```

### Subscription & Billing Endpoints

#### Get Subscription Status
```http
GET /api/subscription
```

#### Create Subscription
```http
POST /api/subscription
```

#### Cancel Subscription
```http
DELETE /api/subscription
```

#### Get Billing History
```http
GET /api/billing/history
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications
```

#### Mark Notification as Read
```http
PUT /api/notifications/{notification_id}/read
```

#### Create Job Alert
```http
POST /api/alerts
```

**Request Body:**
```json
{
  "name": "Remote React Jobs",
  "keywords": ["React", "JavaScript"],
  "location": "Remote",
  "job_types": ["full_time"],
  "salary_min": 80000,
  "frequency": "daily",
  "is_active": true
}
```

## Webhooks

JobNexAI supports webhooks for real-time notifications about important events.

### Setting Up Webhooks

1. Configure webhook URL in your dashboard
2. Select events to subscribe to
3. Verify webhook endpoint

### Supported Events

- `application.status_changed`
- `job.match_found`
- `subscription.updated`
- `notification.created`

### Webhook Payload Example

```json
{
  "id": "evt_123",
  "type": "application.status_changed",
  "created_at": "2024-01-20T10:30:00Z",
  "data": {
    "application_id": "app_123",
    "old_status": "applied",
    "new_status": "interviewing",
    "job": {
      "id": "job_123",
      "title": "Senior Software Engineer",
      "company": "TechCorp Inc."
    }
  }
}
```

## SDK Libraries

Official SDKs are available for popular programming languages:

- **JavaScript/Node.js**: `npm install @jobnexai/sdk`
- **Python**: `pip install jobnexai-sdk`
- **PHP**: `composer require jobnexai/sdk`
- **Ruby**: `gem install jobnexai-sdk`

### JavaScript SDK Example

```javascript
import { JobNexAI } from '@jobnexai/sdk';

const client = new JobNexAI({
  apiKey: 'your_api_key',
  environment: 'production' // or 'staging'
});

// Search jobs
const jobs = await client.jobs.search({
  query: 'software engineer',
  location: 'San Francisco',
  remote: true
});

// Apply for a job
const application = await client.applications.create({
  jobId: 'job_123',
  coverLetter: 'I am excited...'
});
```

## Examples

### Complete Job Search Flow

```javascript
// 1. Search for jobs
const searchResults = await fetch('/api/jobs/search?q=react developer&location=remote', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

// 2. Get detailed job information
const jobDetails = await fetch(`/api/jobs/${jobId}`, {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// 3. Analyze job match
const matchAnalysis = await fetch('/api/matching/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ job_id: jobId })
});

// 4. Apply for the job
const application = await fetch('/api/applications', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_id: jobId,
    cover_letter: 'Customized cover letter...',
    cv_id: 'cv_123'
  })
});
```

### Error Handling Best Practices

```javascript
async function searchJobs(query) {
  try {
    const response = await fetch('/api/jobs/search?q=' + encodeURIComponent(query), {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          // Token expired, refresh or redirect to login
          await refreshToken();
          break;
        case 429:
          // Rate limit exceeded, implement backoff
          await delay(error.retry_after * 1000);
          break;
        default:
          console.error('API Error:', error.error.message);
      }
      
      throw new Error(error.error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}
```

## Need Help?

- **Documentation**: [https://docs.jobnexai.com](https://docs.jobnexai.com)
- **Support**: [support@jobnexai.com](mailto:support@jobnexai.com)
- **Discord Community**: [https://discord.gg/jobnexai](https://discord.gg/jobnexai)
- **Status Page**: [https://status.jobnexai.com](https://status.jobnexai.com)

---

*Last updated: January 2024*