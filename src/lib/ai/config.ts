import { ChatAnthropic } from '@langchain/anthropic';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const ANTHROPIC_DEFAULTS = {
  modelName: ANTHROPIC_MODEL,
  temperature: 0.7,
  maxTokens: 4096,
} as const;

export interface AnthropicModelOverrides {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export function createAnthropicModel(
  overrides: AnthropicModelOverrides = {}
): ChatAnthropic {
  return new ChatAnthropic({
    ...ANTHROPIC_DEFAULTS,
    ...overrides,
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Convierte un error (especialmente APIError del SDK de Anthropic) en string
 * seguro para console.error. Evita pasar el objeto completo, que incluye
 * Headers/Response y puede crashear wrappers de consola (Console Ninja).
 */
export function describeAnthropicError(err: unknown): string {
  if (err instanceof Error) {
    const status = (err as { status?: number }).status;
    const apiMsg = (err as { error?: { error?: { message?: string } } }).error
      ?.error?.message;
    const parts: string[] = [`${err.name}: ${err.message}`];
    if (status !== undefined) parts.push(`status=${status}`);
    if (apiMsg) parts.push(`api="${apiMsg}"`);
    return parts.join(' · ');
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
