# JobNexAI Code Documentation

This document provides comprehensive documentation for the JobNexAI codebase, including architecture, components, utilities, and development guidelines.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Directory Structure](#directory-structure)
3. [Core Components](#core-components)
4. [Utilities & Libraries](#utilities--libraries)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Performance Optimizations](#performance-optimizations)
8. [Security Implementation](#security-implementation)
9. [Testing Framework](#testing-framework)
10. [Build & Deployment](#build--deployment)

## Project Architecture

JobNexAI follows a modern React architecture with TypeScript, utilizing:

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth + JWT
- **State Management**: Context API + Custom Hooks
- **Styling**: Tailwind CSS + Framer Motion
- **Testing**: Jest + Playwright
- **Build Tool**: Vite with optimized bundling

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Edge          │    │   Database      │
│   (React App)   │◄──►│   Functions     │◄──►│   (Supabase)    │
│                 │    │   (Deno)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Caching   │    │   External APIs │    │   File Storage  │
│   (Cloudflare)  │    │   (OpenAI, etc) │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Directory Structure

```
JobNexAI_SaaS/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── auth/                # Authentication components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── forms/               # Form components
│   │   ├── ui/                  # Reusable UI components
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Core utilities & libraries
│   │   ├── api-client.ts        # Optimized API client
│   │   ├── caching-strategy.ts  # Multi-layer caching
│   │   ├── database-optimization.ts # DB query optimization
│   │   ├── monitoring.ts        # Performance monitoring
│   │   ├── security.ts          # Security utilities
│   │   ├── accessibility.ts     # Accessibility helpers
│   │   ├── pwa.ts              # PWA management
│   │   └── seo.tsx             # SEO optimization
│   ├── stores/                  # State management
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Helper utilities
├── public/                      # Static assets
│   ├── icons/                   # PWA icons
│   ├── images/                  # Images
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── offline.html            # Offline fallback
├── docs/                        # Documentation
│   ├── API.md                  # API documentation
│   ├── DEVELOPER_GUIDE.md      # Developer guide
│   ├── CODE_DOCUMENTATION.md   # This file
│   └── openapi.yaml            # OpenAPI specification
├── e2e/                        # End-to-end tests
├── functions/                  # Supabase Edge Functions
├── lib/                        # Legacy utilities (being migrated)
├── migrations/                 # Database migrations
└── __tests__/                  # Unit tests
```

## Core Components

### Authentication System

**Location**: `src/components/auth/`, `src/hooks/useAuth.ts`

```typescript
// Authentication Provider
interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
}

// Usage
const { user, login, logout } = useAuth();
```

**Key Features**:
- JWT token management with automatic refresh
- Multi-factor authentication (MFA) support
- Password strength validation
- Session persistence across tabs

### Dashboard Layout

**Location**: `src/components/DashboardLayout.tsx`

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: boolean;
  header?: boolean;
}

// Features:
// - Responsive sidebar navigation
// - User profile dropdown
// - Notification center
// - Search functionality
// - Theme switching
```

### Job Search System

**Location**: `src/components/JobSearch.tsx`, `src/hooks/useJobSearch.ts`

```typescript
interface JobSearchFilters {
  query?: string;
  location?: string;
  jobType?: JobType;
  remoteType?: RemoteType;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: ExperienceLevel;
}

// Advanced search with real-time filtering
const {
  jobs,
  loading,
  error,
  filters,
  setFilters,
  loadMore,
  hasMore
} = useJobSearch(initialFilters);
```

**Key Features**:
- Real-time search with debouncing
- Advanced filtering and sorting
- Infinite scroll pagination
- Job matching scores
- Saved searches

### Application Tracking

**Location**: `src/components/JobApplications.tsx`

```typescript
interface JobApplication {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  notes?: string;
  timeline: ApplicationEvent[];
}

// Application management
const {
  applications,
  createApplication,
  updateStatus,
  addNote
} = useApplications();
```

**Key Features**:
- Status tracking workflow
- Timeline visualization
- Note-taking system
- Bulk operations
- Export functionality

## Utilities & Libraries

### API Client (`src/lib/api-client.ts`)

Optimized HTTP client with:
- Automatic retry with exponential backoff
- Request/response caching
- Request deduplication
- Error handling and transformation
- Rate limiting compliance

```typescript
import { api } from '../lib/api-client';

// Usage examples
const jobs = await api.get('/jobs/search', { 
  cache: 300, // Cache for 5 minutes
  retries: 3 
});

const application = await api.post('/applications', {
  job_id: 'job_123',
  cover_letter: 'I am interested...'
});
```

### Database Optimization (`src/lib/database-optimization.ts`)

Advanced query optimization:
- Query builder with caching
- Batch operations
- Connection pooling
- Performance monitoring

```typescript
import { DatabaseOptimizer } from '../lib/database-optimization';

// Optimized queries with caching
const jobs = await DatabaseOptimizer
  .from('jobs')
  .select('id, title, company, location')
  .eq('remote_type', 'remote')
  .gte('salary_min', 100000)
  .order('posted_at', false)
  .limit(20)
  .cache(300) // 5 minute cache
  .execute();
```

### Caching Strategy (`src/lib/caching-strategy.ts`)

Multi-layer caching system:
- Memory cache (fastest)
- Session storage (per-tab)
- Local storage (persistent)
- IndexedDB (large data)

```typescript
import { cache } from '../lib/caching-strategy';

// Cache data across multiple layers
await cache.set('user_profile', userData, {
  ttl: 600, // 10 minutes
  layers: ['memory', 'session', 'local']
});

// Retrieve with automatic layer promotion
const profile = await cache.get('user_profile');
```

### Monitoring System (`src/lib/monitoring.ts`)

Comprehensive monitoring:
- Performance tracking
- Error reporting
- User analytics
- Web Vitals measurement

```typescript
import { trackPerformance, trackError } from '../lib/monitoring';

// Track performance metrics
trackPerformance('job_search', duration, {
  query: searchQuery,
  resultCount: jobs.length
});

// Track errors with context
trackError(error, {
  component: 'JobSearch',
  userId: user.id,
  action: 'search'
});
```

### Security Utilities (`src/lib/security.ts`)

Security implementations:
- Input validation and sanitization
- XSS protection
- CSRF protection
- Content Security Policy
- Rate limiting

```typescript
import { validateInput, sanitizeHtml, generateCSP } from '../lib/security';

// Input validation
const isValid = validateInput(userInput, {
  type: 'string',
  maxLength: 100,
  allowedChars: /^[a-zA-Z0-9\s\-_.]+$/
});

// HTML sanitization
const cleanHtml = sanitizeHtml(userContent);
```

### Accessibility Helpers (`src/lib/accessibility.ts`)

Accessibility utilities:
- Screen reader announcements
- Focus management
- Keyboard navigation
- ARIA helpers
- Color contrast validation

```typescript
import { 
  screenReader, 
  focusManager,
  ColorContrast 
} from '../lib/accessibility';

// Screen reader announcements
screenReader.announce('Search completed. 25 jobs found.');

// Focus management
focusManager.trapFocus(modalElement);

// Color contrast validation
const isAccessible = ColorContrast.meetsWCAG('#000000', '#ffffff', 'AA');
```

### PWA Management (`src/lib/pwa.ts`)

Progressive Web App features:
- Service worker management
- Install prompts
- Offline functionality
- Background sync
- Push notifications

```typescript
import { pwaManager, installPWA, isOnline } from '../lib/pwa';

// Check if app can be installed
if (canInstallPWA()) {
  await installPWA();
}

// Handle online/offline status
window.addEventListener('connection-change', (event) => {
  if (event.detail.isOnline) {
    syncOfflineData();
  }
});
```

### SEO Optimization (`src/lib/seo.tsx`)

SEO and meta tag management:
- Dynamic meta tags
- Structured data
- Open Graph tags
- Twitter Cards
- Sitemap generation

```typescript
import { SEO } from '../lib/seo';

// In React components
<SEO 
  title="Software Engineer Jobs in San Francisco"
  description="Find the best software engineering jobs in San Francisco"
  keywords={['software engineer', 'javascript', 'react']}
  structuredData={jobListingSchema}
/>
```

## State Management

### Context Providers

```typescript
// Authentication Context
<AuthProvider>
  <App />
</AuthProvider>

// Theme Context
<ThemeProvider>
  <App />
</ThemeProvider>

// Notification Context
<NotificationProvider>
  <App />
</NotificationProvider>
```

### Custom Hooks

```typescript
// Data fetching hooks
const { data, loading, error, refetch } = useQuery(key, fetcher);
const { mutate, loading } = useMutation(mutationFn);

// UI state hooks
const { isOpen, open, close, toggle } = useDisclosure();
const { value, onChange } = useInput(initialValue);
const { isVisible, ref } = useIntersectionObserver();

// Business logic hooks
const { jobs, filters, search } = useJobSearch();
const { applications, apply, updateStatus } = useApplications();
const { user, login, logout } = useAuth();
```

## API Integration

### Supabase Client Configuration

```typescript
// src/hooks/useSupabaseConfig.ts
export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'jobnexai-auth',
          autoRefreshToken: true
        }
      }
    );
  }
  return supabaseInstance;
};
```

### Edge Functions

```typescript
// functions/job-matching/index.ts
export async function analyzeJobMatch(userId: string, jobId: string) {
  // Fetch user skills and job requirements
  const [userSkills, jobDetails] = await Promise.all([
    getUserSkills(userId),
    getJobDetails(jobId)
  ]);
  
  // Use OpenAI for matching analysis
  const analysis = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Analyze job-candidate match...'
      }
    ]
  });
  
  return JSON.parse(analysis.choices[0].message.content);
}
```

## Performance Optimizations

### Bundle Optimization

**Vite Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', '@headlessui/react']
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.jobnexai\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ]
});
```

### Lazy Loading Implementation

```typescript
// App.tsx - Component lazy loading
const JobSearch = React.lazy(() => 
  import('./components/JobSearch').then(module => ({ 
    default: module.JobSearch 
  }))
);

const CVBuilder = React.lazy(() => 
  import('./components/cv/CVBuilder').then(module => ({ 
    default: module.CVBuilder 
  }))
);

// Usage with Suspense
<Suspense fallback={<ComponentLoadingFallback />}>
  <Routes>
    <Route path="/jobs" element={<JobSearch />} />
    <Route path="/cv-builder" element={<CVBuilder />} />
  </Routes>
</Suspense>
```

### Image Optimization

```typescript
// components/LazyImage.tsx
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { rootMargin: '50px' });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // WebP/AVIF support with fallbacks
  const optimizedSrcSet = useMemo(() => {
    const basePath = src.split('.').slice(0, -1).join('.');
    return [
      `${basePath}_640w.webp 640w`,
      `${basePath}_1024w.webp 1024w`,
      `${src} 2000w`
    ].join(', ');
  }, [src]);

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          srcSet={optimizedSrcSet}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
});
```

## Security Implementation

### Input Validation

```typescript
// src/lib/security.ts
export const validateInput = (
  input: string, 
  rules: ValidationRules
): ValidationResult => {
  const errors: string[] = [];
  
  if (rules.required && !input.trim()) {
    errors.push('This field is required');
  }
  
  if (input && rules.maxLength && input.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
  }
  
  if (input && rules.pattern && !rules.pattern.test(input)) {
    errors.push('Invalid format');
  }
  
  if (input && rules.sanitize) {
    input = sanitizeInput(input);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: input
  };
};
```

### Content Security Policy

```typescript
// Security headers configuration
export const generateCSP = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jobnexai.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.jobnexai.com wss://ws.jobnexai.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};
```

## Testing Framework

### Unit Tests (Jest)

```typescript
// lib/__tests__/emailService.test.ts
describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification email successfully', async () => {
    const mockResponse = {
      data: { success: true, messageId: 'test-message-id' },
      error: null
    };
    
    (supabase.functions.invoke as jest.Mock).mockResolvedValue(mockResponse);

    const result = await sendNotificationEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test message</p>'
    });

    expect(result.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
      body: expect.objectContaining({
        to: 'test@example.com',
        subject: 'Test Subject'
      })
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/job-search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Job Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should search for jobs and display results', async ({ page }) => {
    await page.goto('/jobs');
    
    // Search for jobs
    await page.fill('[data-testid="search-input"]', 'software engineer');
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="job-card"]');
    
    // Verify results
    const jobCards = await page.locator('[data-testid="job-card"]').count();
    expect(jobCards).toBeGreaterThan(0);
    
    // Check job card content
    const firstJob = page.locator('[data-testid="job-card"]').first();
    await expect(firstJob.locator('[data-testid="job-title"]')).toBeVisible();
    await expect(firstJob.locator('[data-testid="company-name"]')).toBeVisible();
  });

  test('should apply filters and update results', async ({ page }) => {
    await page.goto('/jobs');
    
    // Apply remote filter
    await page.click('[data-testid="remote-filter"]');
    await page.click('[data-testid="remote-only"]');
    
    // Apply salary filter
    await page.fill('[data-testid="salary-min"]', '100000');
    
    // Submit filters
    await page.click('[data-testid="apply-filters"]');
    
    // Verify filtered results
    await page.waitForSelector('[data-testid="job-card"]');
    const remoteJobs = await page.locator('[data-testid="remote-badge"]').count();
    expect(remoteJobs).toBeGreaterThan(0);
  });
});
```

## Build & Deployment

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

```bash
# .env file structure
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_OPENAI_API_KEY=sk-...
VITE_SENTRY_DSN=https://...
VITE_APP_URL=https://jobnexai.com
```

### Deployment Configuration

```yaml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'"

[[redirects]]
  from = "/api/*"
  to = "https://api.jobnexai.com/:splat"
  status = 200
```

### Performance Monitoring

```typescript
// Build-time performance analysis
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Runtime performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify(metric);
  
  // Use sendBeacon if available for reliability
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { body, method: 'POST', keepalive: true });
  }
}

// Measure Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Follow React hooks best practices

### Git Workflow

```bash
# Feature development
git checkout -b feature/job-matching-algorithm
git commit -m "feat: implement job matching algorithm"
git push origin feature/job-matching-algorithm

# Bug fixes
git checkout -b fix/search-pagination-issue
git commit -m "fix: resolve pagination issue in job search"

# Documentation
git commit -m "docs: update API documentation"
```

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

---

*Last updated: January 2024*