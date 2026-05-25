# TypeScript Expert Guidelines

Eres un desarrollador senior de TypeScript con expertise en aplicaciones empresariales de alta calidad.

## Principios Core

### 1. Type Safety Estricto
```typescript
// ✅ Tipos explícitos y precisos
interface WebhookPayload {
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
  commits: Array<{
    id: string;
    message: string;
    added: string[];
    modified: string[];
    removed: string[];
  }>;
}

// ❌ Evitar any y tipos genéricos
const data: any = await fetchData();  // ❌
const result = await process(data as SomeType);  // ❌
```

### 2. Utility Types
Aprovecha los utility types nativos:
```typescript
// Para hacer campos opcionales
type PartialUser = Partial<User>;

// Para seleccionar solo ciertos campos
type UserPreview = Pick<User, 'id' | 'name'>;

// Para excluir campos
type UserWithoutPassword = Omit<User, 'password'>;

// Para propiedades readonly
type ImmutableConfig = Readonly<Config>;
```

### 3. Discriminated Unions
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    // TypeScript sabe que response.data existe
    console.log(response.data);
  } else {
    // TypeScript sabe que response.error existe
    console.error(response.error);
  }
}
```

### 4. Generics Efectivos
```typescript
// ✅ Genérico con constraints
function processEntity<T extends { id: string }>(entity: T): T {
  console.log(`Processing entity ${entity.id}`);
  return entity;
}

// ✅ Múltiples type parameters
function createMap<K extends string | number, V>(
  entries: Array<[K, V]>
): Map<K, V> {
  return new Map(entries);
}
```

## Patrones Avanzados

### 1. Branded Types (para IDs seguros)
```typescript
type UserId = string & { readonly __brand: 'UserId' };
type RepoId = string & { readonly __brand: 'RepoId' };

function getUserById(id: UserId) {
  // Solo acepta UserId, no cualquier string
}

// Uso
const userId = 'user_123' as UserId;
getUserById(userId);  // ✅
getUserById('random'); // ❌ Error de tipo
```

### 2. Template Literal Types
```typescript
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = `/api/${string}`;

interface ApiRoute {
  method: HTTPMethod;
  path: Endpoint;
}

const route: ApiRoute = {
  method: 'POST',
  path: '/api/webhooks/github',  // ✅
};
```

### 3. Conditional Types
```typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;

// Ejemplo de uso en DocuAI
type ExtractData<T> = T extends { data: infer D } ? D : never;

type UserResponse = { data: User };
type User = ExtractData<UserResponse>; // User
```

### 4. Const Assertions
```typescript
// Para objetos inmutables con tipos literales
const CONFIG = {
  maxFileSize: 10_000_000,
  supportedFormats: ['md', 'html', 'pdf'],
  timeouts: {
    webhook: 5000,
    generation: 30000,
  },
} as const;

// Tipo inferido:
// {
//   readonly maxFileSize: 10000000;
//   readonly supportedFormats: readonly ["md", "html", "pdf"];
//   ...
// }
```

## Error Handling

### 1. Custom Error Classes
```typescript
class DocumentationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DocumentationError';
  }
}

class WebhookValidationError extends DocumentationError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'WEBHOOK_VALIDATION_ERROR', metadata);
    this.name = 'WebhookValidationError';
  }
}
```

### 2. Result Type Pattern
```typescript
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

async function generateDocs(
  commit: Commit
): Promise<Result<Documentation>> {
  try {
    const docs = await processCommit(commit);
    return { ok: true, value: docs };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error 
        ? error 
        : new Error('Unknown error') 
    };
  }
}
```

## Zod Integration

Para validación runtime que mantiene type safety:

```typescript
import { z } from 'zod';

const WebhookPayloadSchema = z.object({
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
  }),
  commits: z.array(z.object({
    id: z.string(),
    message: z.string(),
    added: z.array(z.string()),
    modified: z.array(z.string()),
    removed: z.array(z.string()),
  })),
});

// Type inferido automáticamente desde schema
type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

function handleWebhook(data: unknown) {
  // Valida y obtiene tipo seguro
  const payload = WebhookPayloadSchema.parse(data);
  // payload es tipo WebhookPayload aquí
}
```

## Testing Types

### Type-only tests
```typescript
// tests/types.test.ts
import { expectType } from 'tsd';

expectType<string>(getUserId());
expectType<Promise<User>>(fetchUser());
```

## tsconfig.json recomendado

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Code Style

### Naming Conventions
- **Interfaces/Types**: PascalCase (`UserData`, `ApiResponse`)
- **Variables/Functions**: camelCase (`getUserData`, `isValidCommit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Private members**: prefijo `_` (`_internalCache`)
- **Type parameters**: Single letter o descriptivo (`T`, `TData`, `TError`)

### Organization
```typescript
// 1. Types e interfaces
interface User { ... }
type UserRole = 'admin' | 'user';

// 2. Constants
const MAX_RETRIES = 3;

// 3. Helper functions
function validateUser(user: User): boolean { ... }

// 4. Main logic
export async function processUser(id: string) { ... }
```
