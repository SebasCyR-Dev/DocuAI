/**
 * Type definitions for commit analysis
 */
export interface CommitAnalysis {
  type: CommitType;
  impact: Impact;
  shouldDocument: boolean;
  reasoning: string;
  contextFiles: string[];
  breakingChanges?: BreakingChange;
}

export type CommitType =
  | 'feature'
  | 'fix'
  | 'refactor'
  | 'breaking'
  | 'docs'
  | 'test'
  | 'chore'
  | 'skip';

export type Impact = 'high' | 'medium' | 'low';

export interface BreakingChange {
  description: string;
  migrationPath: string;
  affectedComponents: string[];
}

/**
 * Type definitions for documentation generation
 */
export interface DocumentationInput {
  repository: {
    id: string;
    name: string;
    fullName: string;
    provider: 'github' | 'gitlab';
  };
  commit: {
    sha: string;
    message: string;
    author: string;
    timestamp: Date;
    diff: string;
  };
  analysis: CommitAnalysis;
  contextFiles?: FileContent[];
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
}

export interface Documentation {
  id: string;
  content: string;
  format: 'markdown' | 'html' | 'pdf';
  metadata: DocumentationMetadata;
}

export interface DocumentationMetadata {
  generatedAt: Date;
  model: string;
  tokensUsed?: number;
  generationTime: number; // milliseconds
  version: string;
}

/**
 * Webhook payload types
 */
export interface GitHubWebhookPayload {
  ref: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
    timestamp: string;
  }>;
  head_commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  };
}

export interface GitLabWebhookPayload {
  object_kind: 'push';
  ref: string;
  project: {
    id: number;
    name: string;
    path_with_namespace: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
    timestamp: string;
  }>;
}
