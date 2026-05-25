/**
 * Configuration constants for DocuAI Agent
 */

export const APP_CONFIG = {
  name: 'DocuAI Agent',
  version: '0.1.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const AI_CONFIG = {
  claude: {
    model: 'claude-sonnet-4.5',
    temperature: 0.2,
    maxTokens: 4096,
  },
  openai: {
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 4096,
  },
  streaming: true,
  timeout: 30000, // 30s
} as const;

export const DOCUMENTATION_CONFIG = {
  formats: ['markdown', 'html', 'pdf'] as const,
  defaultFormat: 'markdown' as const,
  maxFileSize: 10_000_000, // 10MB
  supportedLanguages: [
    'typescript',
    'javascript',
    'python',
    'java',
    'go',
    'rust',
    'php',
    'ruby',
    'csharp',
  ] as const,
} as const;

export const WEBHOOK_CONFIG = {
  timeout: 5000, // 5s response time
  maxRetries: 3,
  retryDelay: 1000, // 1s
} as const;

export const QUEUE_CONFIG = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jobs: {
    'process-commit': {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      timeout: 60000, // 60s
    },
    'generate-pdf': {
      attempts: 2,
      backoff: {
        type: 'exponential' as const,
        delay: 1000,
      },
      timeout: 30000, // 30s
    },
  },
} as const;

export const RATE_LIMITS = {
  webhook: {
    free: { limit: 10, window: '1m' },
    starter: { limit: 50, window: '1m' },
    pro: { limit: 200, window: '1m' },
    enterprise: { limit: 1000, window: '1m' },
  },
  api: {
    free: { limit: 100, window: '1h' },
    starter: { limit: 500, window: '1h' },
    pro: { limit: 2000, window: '1h' },
    enterprise: { limit: 10000, window: '1h' },
  },
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      repositories: 1,
      commitsPerMonth: 100,
      formats: ['markdown'],
      support: 'community',
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    features: {
      repositories: 3,
      commitsPerMonth: 500,
      formats: ['markdown', 'html', 'pdf'],
      support: 'email',
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: {
      repositories: 10,
      commitsPerMonth: 2000,
      formats: ['markdown', 'html', 'pdf'],
      support: 'priority',
      customTemplates: true,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: {
      repositories: -1, // unlimited
      commitsPerMonth: -1, // unlimited
      formats: ['markdown', 'html', 'pdf'],
      support: 'dedicated',
      customTemplates: true,
      onPremise: true,
      sso: true,
    },
  },
} as const;
