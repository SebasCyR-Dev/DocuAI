# Arquitectura de DocuAI Agent

## Visión General

DocuAI Agent es una plataforma SaaS diseñada con una arquitectura moderna, escalable y orientada a microservicios para procesar commits de código y generar documentación técnica automatizada mediante inteligencia artificial.

## Principios de Diseño

### 1. Separation of Concerns
Cada componente tiene una responsabilidad clara y bien definida.

### 2. Scalability First
El sistema está diseñado para escalar horizontalmente en cada capa.

### 3. Privacy by Design
Zero data retention: el código del usuario nunca se almacena, solo se procesa en memoria.

### 4. Performance Obsessed
Target: <30s desde commit hasta documentación generada.

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Dashboard  │  │  GitHub App  │  │  GitLab App  │        │
│  │   (Next.js)  │  │  (OAuth)     │  │  (OAuth)     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js API Routes (Vercel)                 │  │
│  │  • Authentication & Authorization                        │  │
│  │  • Rate Limiting                                         │  │
│  │  • Request Validation                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Webhook    │  │     Queue    │  │  Background  │        │
│  │   Handler    │  │   Manager    │  │   Workers    │        │
│  │  (Express)   │  │  (BullMQ)    │  │  (Railway)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    LangChain Agent                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │  Analyzer  │  │ Generator  │  │  Formatter │        │  │
│  │  │   Chain    │  │   Chain    │  │    Chain   │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │    Claude    │  │   GPT-4o     │                           │
│  │  Sonnet 4.5  │  │    mini      │                           │
│  │ (Anthropic)  │  │   (OpenAI)   │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │     Redis    │  │   Supabase   │        │
│  │   (Prisma)   │  │    (Cache)   │  │   Storage    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. Frontend (Dashboard)

**Tecnología**: Next.js 14 (App Router) + React + TypeScript

**Responsabilidades**:
- Interfaz de usuario
- Autenticación con Supabase Auth
- Gestión de repositorios conectados
- Visualización de documentación generada
- Dashboard de métricas

**Arquitectura**:
```
src/app/
├── (auth)/              # Rutas autenticadas
│   ├── dashboard/       # Dashboard principal
│   ├── repositories/    # Gestión de repos
│   └── settings/        # Configuración
├── (public)/           # Landing, pricing, etc
└── api/                # API routes
    ├── webhooks/       # Endpoints para webhooks
    └── auth/           # Callbacks OAuth
```

### 2. Webhook Handler

**Tecnología**: Next.js API Routes (Edge Functions)

**Responsabilidades**:
- Recibir webhooks de GitHub/GitLab
- Validar signatures (HMAC SHA-256)
- Rate limiting
- Enqueue jobs para procesamiento asíncrono

**Flujo**:
```typescript
1. Recibe webhook POST
2. Valida signature
3. Extrae metadata (repo, commit, author)
4. Enqueue job en BullMQ
5. Responde 200 OK inmediatamente
```

**Performance**: <1s de respuesta

### 3. Queue Manager

**Tecnología**: BullMQ + Redis

**Responsabilidades**:
- Cola de jobs de procesamiento
- Retry logic con backoff exponencial
- Priorización de jobs (paid users > free tier)
- Monitoring y métricas

**Jobs**:
- `process-commit`: Analiza commit y genera docs
- `generate-pdf`: Exporta docs a PDF
- `sync-repository`: Full scan de repo

### 4. Background Workers

**Tecnología**: Node.js workers + BullMQ

**Deployment**: Railway / Render (auto-scaling)

**Responsabilidades**:
- Consume jobs de la cola
- Orquesta el pipeline de generación
- Maneja errores y retries
- Reporta métricas

**Pipeline**:
```typescript
async function processCommitJob(job: Job) {
  const { repoId, commitSha } = job.data;
  
  // 1. Fetch commit diff from GitHub/GitLab
  const diff = await fetchCommitDiff(repoId, commitSha);
  
  // 2. Analyze with AI
  const analysis = await analyzeCommit(diff);
  
  // 3. Should document?
  if (!analysis.shouldDocument) {
    return { skipped: true, reason: analysis.reasoning };
  }
  
  // 4. Generate documentation
  const docs = await generateDocumentation(analysis);
  
  // 5. Format output
  const formatted = await formatDocumentation(docs, format);
  
  // 6. Save to repo or storage
  await saveDocumentation(repoId, formatted);
  
  return { success: true };
}
```

### 5. LangChain Agent

**Tecnología**: LangChain.js + Claude + GPT

**Arquitectura**:

```typescript
// Chain 1: Commit Analyzer
const analyzerChain = RunnableSequence.from([
  promptTemplate,           // Prompt con diff y contexto
  claudeModel,              // Claude Sonnet 4.5
  structuredOutputParser,   // Parse a CommitAnalysis type
]);

// Chain 2: Documentation Generator
const generatorChain = RunnableSequence.from([
  contextAggregator,        // Lee archivos relacionados
  documentationPrompt,      // Genera docs
  claudeModel,
  markdownParser,
]);

// Chain 3: Format Converter
const formatterChain = RunnableSequence.from([
  formatSelector,           // MD, HTML, PDF
  converterTool,
  outputValidator,
]);
```

**Optimizaciones**:
- **Streaming**: Para respuestas largas
- **Caching**: Prompts repetidos
- **Fallback**: GPT-4o-mini si Claude falla
- **Context window management**: Chunking inteligente

### 6. Integrations Layer

#### GitHub Integration

```typescript
// Octokit client
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Fetch commit diff
const diff = await octokit.repos.compareCommits({
  owner,
  repo,
  base: parentSha,
  head: commitSha,
});
```

**Scopes requeridos**: `repo`, `read:user`

#### GitLab Integration

```typescript
// GitBeaker client
import { Gitlab } from '@gitbeaker/node';

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN,
});

const commit = await gitlab.Commits.show(projectId, sha);
const diff = await gitlab.Commits.diff(projectId, sha);
```

**Scopes requeridos**: `api`, `read_repository`

### 7. Database Schema (Prisma)

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  repositories  Repository[]
  subscription  Subscription?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Repository {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id])
  provider      Provider       // GITHUB | GITLAB
  externalId    String         // Repo ID en provider
  name          String
  fullName      String         // owner/repo
  webhookSecret String         // Para validar webhooks
  config        Json           // Configuración (formatos, idioma, etc)
  documentations Documentation[]
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  @@unique([provider, externalId])
}

model Documentation {
  id            String         @id @default(cuid())
  repositoryId  String
  repository    Repository     @relation(fields: [repositoryId], references: [id])
  commitSha     String
  commitMessage String
  type          ChangeType     // FEATURE | FIX | REFACTOR | BREAKING
  content       String         @db.Text
  format        Format         // MARKDOWN | HTML | PDF
  storagePath   String?        // Path en Supabase Storage
  metadata      Json           // Análisis, métricas, etc
  createdAt     DateTime       @default(now())
  
  @@index([repositoryId, createdAt])
  @@index([commitSha])
}

model Subscription {
  id            String         @id @default(cuid())
  userId        String         @unique
  user          User           @relation(fields: [userId], references: [id])
  plan          Plan           // STARTER | PRO | ENTERPRISE
  status        Status         // ACTIVE | CANCELED | PAST_DUE
  stripeId      String?        // Stripe subscription ID
  currentPeriodEnd DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum Provider {
  GITHUB
  GITLAB
}

enum ChangeType {
  FEATURE
  FIX
  REFACTOR
  BREAKING
  DOCS
  TEST
  SKIP
}

enum Format {
  MARKDOWN
  HTML
  PDF
}

enum Plan {
  STARTER
  PRO
  ENTERPRISE
}

enum Status {
  ACTIVE
  CANCELED
  PAST_DUE
}
```

## Flujo End-to-End

### Caso de Uso: Developer hace commit

```
1. Developer: git push origin main
   │
2. GitHub: Envía webhook POST a /api/webhooks/github
   │
3. Webhook Handler:
   ├─ Valida signature
   ├─ Extrae datos del commit
   ├─ Verifica repo está activo
   └─ Enqueue job "process-commit"
   │
4. BullMQ: Job entra en cola (Redis)
   │
5. Worker: Toma job de la cola
   │
6. Worker: Fetch commit diff de GitHub API
   │
7. LangChain Agent:
   ├─ Chain 1: Analiza diff → CommitAnalysis
   ├─ Decision: ¿Documentar? → Sí
   ├─ Chain 2: Lee contexto (archivos relacionados)
   └─ Chain 3: Genera documentación → Markdown
   │
8. Worker: Formatea output según config del repo
   │
9. Worker: Guarda documentación en DB + Supabase Storage
   │
10. Worker: (Opcional) Commit docs al repo
    │
11. Worker: Notifica usuario (webhook, email, etc)
    │
12. Dashboard: Usuario ve nueva documentación
```

**Tiempo total**: ~25s (target <30s)

## Seguridad

### 1. Webhook Signature Validation

```typescript
import crypto from 'crypto';

function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### 2. Zero Data Retention

```typescript
// ✅ Código del usuario NUNCA se guarda
async function processCommit(diff: string) {
  try {
    // Process in-memory
    const docs = await generateDocs(diff);
    return docs;
  } finally {
    // Diff se descarta automáticamente (garbage collected)
    // Solo guardamos la documentación generada
  }
}
```

### 3. Rate Limiting

```typescript
// API route con rate limit
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // Process webhook...
}
```

## Escalabilidad

### Horizontal Scaling

- **Frontend**: Auto-scaling en Vercel (Serverless)
- **Workers**: Auto-scaling en Railway (containerizados)
- **Database**: Supabase managed (auto-scaling)
- **Redis**: Upstash Redis (serverless)

### Performance Optimizations

1. **Edge Functions**: Webhooks ejecutados en edge (low latency)
2. **Caching**: Redis para análisis repetidos
3. **Streaming**: LangChain streaming para respuestas largas
4. **Batch processing**: Múltiples commits en un PR → Un job
5. **CDN**: Static assets + docs generados en Cloudflare

### Monitoring

- **Error tracking**: Sentry
- **Logs**: Axiom / Baselime
- **Metrics**: Vercel Analytics + custom metrics
- **Tracing**: LangChain tracing (LangSmith)

## Próximos Pasos

1. Implementar webhook handler básico
2. Setup BullMQ + Redis
3. Implementar primer chain de LangChain (analyzer)
4. Integración GitHub API
5. Testing E2E del flujo completo
