/**
 * Custom error classes for DocuAI Agent
 */

export class DocumentationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DocumentationError';
    Object.setPrototypeOf(this, DocumentationError.prototype);
  }
}

export class WebhookValidationError extends DocumentationError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'WEBHOOK_VALIDATION_ERROR', metadata);
    this.name = 'WebhookValidationError';
    Object.setPrototypeOf(this, WebhookValidationError.prototype);
  }
}

export class RepositoryNotFoundError extends DocumentationError {
  constructor(repositoryId: string) {
    super(
      `Repository not found: ${repositoryId}`,
      'REPOSITORY_NOT_FOUND',
      { repositoryId }
    );
    this.name = 'RepositoryNotFoundError';
    Object.setPrototypeOf(this, RepositoryNotFoundError.prototype);
  }
}

export class AIGenerationError extends DocumentationError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'AI_GENERATION_ERROR', metadata);
    this.name = 'AIGenerationError';
    Object.setPrototypeOf(this, AIGenerationError.prototype);
  }
}

export class RateLimitError extends DocumentationError {
  constructor(limit: number, window: string) {
    super(
      `Rate limit exceeded: ${limit} requests per ${window}`,
      'RATE_LIMIT_EXCEEDED',
      { limit, window }
    );
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
