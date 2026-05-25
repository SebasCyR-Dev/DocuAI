# 🎯 Plan de Desarrollo - Etapas 5-9 (Continuación)

## Tabla de Contenido

5. **[Queue & Background Jobs](#etapa-5-queue--background-jobs)** (3-4 días)
6. **[Dashboard de Usuario](#etapa-6-dashboard-de-usuario)** (4-5 días)
7. **[Exportación PDF/HTML](#etapa-7-exportación-pdfhtml)** (2-3 días)
8. **[GitLab Support](#etapa-8-gitlab-support)** (2-3 días)
9. **[Optimización & Producción](#etapa-9-optimización--producción)** (5-7 días)

---

## Etapa 5: Queue & Background Jobs

**Objetivo**: Procesar commits en background con BullMQ para que el webhook responda rápido (<1s).

### 📦 Qué necesitas

**Opción A: Redis con Docker (desarrollo local)**

```bash
docker run -d -p 6379:6379 --name docuai-redis redis:alpine
```

**Opción B: Upstash (cloud, gratis)**

1. Ve a [upstash.com](https://upstash.com)
2. Crea cuenta → Create Database → Redis
3. Copia la URL (ej: `redis://default:xxx@xxx.upstash.io:6379`)

### 🛠️ Implementación

#### 5.1. Configurar Redis

En `.env.local`:

```env
# Opción A: Local
REDIS_URL=redis://localhost:6379

# Opción B: Upstash
REDIS_URL=redis://default:tu-password@xxx.upstash.io:6379
```

#### 5.2. Crear Queue Manager

Crear archivo: `src/services/queue/manager.ts`

```typescript
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const documentationQueue = new Queue('documentation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Mantener últimos 100 completados
    removeOnFail: 50, // Mantener últimos 50 fallidos
  },
});

export interface ProcessCommitJobData {
  repositoryId: string;
  repositoryName: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  commitTimestamp: string;
  files: string[];
  diff: string;
}

export async function enqueueCommitJob(data: ProcessCommitJobData) {
  const job = await documentationQueue.add('process-commit', data, {
    jobId: `commit-${data.commitSha}`, // Evita duplicados
  });

  console.log(`📬 Job enqueued: ${job.id}`);
  return job;
}
```

#### 5.3. Crear Worker

Crear archivo: `src/services/queue/worker.ts`

```typescript
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { analyzeCommit } from '@/lib/langchain/analyzer';
import { generateDocumentation } from '@/lib/langchain/generator';
import { saveDocumentation } from '@/services/documentation/save';
import type { ProcessCommitJobData } from './manager';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

async function processCommitJob(job: Job<ProcessCommitJobData>) {
  const data = job.data;

  console.log(`🔄 Processing job ${job.id}...`);
  await job.updateProgress(10);

  // 1. Analizar commit
  console.log('🤖 Analizando commit...');
  const analysis = await analyzeCommit(
    data.commitMessage,
    data.files,
    data.diff
  );

  await job.updateProgress(40);

  // 2. Decidir si documentar
  if (!analysis.shouldDocument) {
    console.log('⏭️  Commit skipped:', analysis.reasoning);
    return { skipped: true, reason: analysis.reasoning };
  }

  // 3. Generar documentación
  console.log('📝 Generando documentación...');
  const documentation = await generateDocumentation({
    repository: {
      id: data.repositoryId,
      name: data.repositoryName.split('/')[1],
      fullName: data.repositoryName,
      provider: 'github',
    },
    commit: {
      sha: data.commitSha,
      message: data.commitMessage,
      author: data.commitAuthor,
      timestamp: new Date(data.commitTimestamp),
      diff: data.diff,
    },
    analysis,
  });

  await job.updateProgress(70);

  // 4. Guardar en DB
  console.log('💾 Guardando en DB...');
  const saved = await saveDocumentation({
    repositoryId: data.repositoryId,
    commitSha: data.commitSha,
    commitMessage: data.commitMessage,
    commitAuthor: data.commitAuthor,
    analysis,
    content: documentation,
  });

  await job.updateProgress(100);

  console.log(`✅ Job ${job.id} completed!`);
  return {
    success: true,
    documentationId: saved.id,
    type: analysis.type,
  };
}

// Crear worker
export const worker = new Worker('documentation', processCommitJob, {
  connection,
  concurrency: 2, // Procesar 2 jobs en paralelo
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000, // por minuto (rate limiting)
  },
});

// Event handlers
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('👷 Worker started');
```

#### 5.4. Iniciar Worker (Desarrollo)

Crear archivo: `scripts/dev-worker.ts`

```typescript
import 'dotenv/config';
import { worker } from '../src/services/queue/worker';

console.log('🚀 Starting development worker...');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down worker...');
  await worker.close();
  process.exit(0);
});
```

Agregar script en `package.json`:

```json
{
  "scripts": {
    "worker": "tsx watch scripts/dev-worker.ts"
  }
}
```

#### 5.5. Actualizar Webhook para Usar Queue

Actualizar `src/app/api/webhooks/github/route.ts`:

```typescript
import { enqueueCommitJob } from '@/services/queue/manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (signature && !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const commit = payload.head_commit;

    if (!commit) {
      return NextResponse.json({ error: 'No commit data' }, { status: 400 });
    }

    console.log('🎉 Webhook recibido:', payload.repository.full_name);

    // ✨ Encolar job (en vez de procesar aquí)
    await enqueueCommitJob({
      repositoryId: payload.repository.id.toString(),
      repositoryName: payload.repository.full_name,
      commitSha: commit.id,
      commitMessage: commit.message,
      commitAuthor: commit.author.name,
      commitTimestamp: commit.timestamp,
      files: [...(commit.added || []), ...(commit.modified || [])],
      diff: JSON.stringify(commit, null, 2).substring(0, 3000),
    });

    // Responder rápido (<1s)
    return NextResponse.json({
      received: true,
      message: 'Job enqueued',
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 🧪 Pruebas de Etapa 5

#### Test 1: Redis Conectado

```bash
# Si usas Docker
docker ps | grep redis
# Debe aparecer running

# Test de conexión
redis-cli ping
# Debe retornar: PONG
```

#### Test 2: Queue Manager

Crear `test-queue.ts`:

```typescript
import { enqueueCommitJob } from './src/services/queue/manager';

enqueueCommitJob({
  repositoryId: '123',
  repositoryName: 'test/repo',
  commitSha: 'abc123',
  commitMessage: 'test commit',
  commitAuthor: 'tester',
  commitTimestamp: new Date().toISOString(),
  files: ['test.ts'],
  diff: 'test diff',
})
  .then(() => console.log('✅ Job enqueued'))
  .catch(console.error);
```

Ejecutar:

```bash
npx tsx test-queue.ts
# Debe mostrar: 📬 Job enqueued: commit-abc123
```

#### Test 3: Worker Procesa Jobs

Terminal 1:

```bash
pnpm worker
# Debe mostrar: 👷 Worker started
```

Terminal 2:

```bash
npx tsx test-queue.ts
```

Terminal 1 debe mostrar:

```
🔄 Processing job commit-abc123...
🤖 Analizando commit...
📝 Generando documentación...
💾 Guardando en DB...
✅ Job completed!
```

#### Test 4: Webhook → Queue → Worker

1. Asegúrate que están corriendo:
   - Terminal 1: `pnpm dev`
   - Terminal 2: `pnpm worker`
   - Terminal 3: `ngrok http 3000`

2. Haz commit en GitHub

3. Observa:
   - Terminal 1 (webhook): "📬 Job enqueued"
   - Terminal 2 (worker): Procesa el job completo

4. Webhook responde en <1s ✅

#### Test 5: Ver Jobs en Redis

```bash
# Instalar BullMQ Board (opcional)
npm install -g bullmq-board

# Iniciar dashboard
bullmq-board

# Abrir http://localhost:3000
# Ver jobs, stats, errores
```

### ✅ Criterios de Éxito - Etapa 5

- [ ] Redis instalado y corriendo
- [ ] Queue manager crea jobs
- [ ] Worker procesa jobs exitosamente
- [ ] Webhook responde <1s (job encolado)
- [ ] Worker completa análisis + generación + guardado
- [ ] Jobs fallidos hacen retry automático
- [ ] Puedes ver jobs en BullMQ Board (opcional)

**Si todo ✅ → Avanza a Etapa 6**

---

## Etapa 6: Dashboard de Usuario

**Objetivo**: Dashboard donde el usuario ve sus repositorios y documentación generada.

### 🛠️ Implementación

#### 6.1. Crear Modelo de Repository en DB

Actualizar `src/app/dashboard/page.tsx`:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Obtener o crear usuario en nuestra DB
  let user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      repositories: {
        include: {
          documentations: {
            orderBy: { generatedAt: 'desc' },
            take: 5,
          },
        },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: session.user.email!,
        name: session.user.user_metadata?.name,
        avatarUrl: session.user.user_metadata?.avatar_url,
      },
      include: {
        repositories: {
          include: {
            documentations: {
              orderBy: { generatedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">DocuAI Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
                  Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Repositorios</div>
            <div className="mt-2 text-3xl font-bold">{user.repositories.length}</div>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Docs Generadas</div>
            <div className="mt-2 text-3xl font-bold">
              {user.repositories.reduce(
                (acc, repo) => acc + repo.documentations.length,
                0
              )}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Plan</div>
            <div className="mt-2 text-3xl font-bold">Free</div>
          </div>
        </div>

        {/* Repositories */}
        <div className="rounded-lg border bg-white">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Repositorios Conectados</h2>
          </div>

          {user.repositories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No tienes repositorios conectados</p>
              <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Conectar Repositorio
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {user.repositories.map((repo) => (
                <div key={repo.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{repo.fullName}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {repo.documentations.length} docs generadas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          repo.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {repo.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Recent docs */}
                  {repo.documentations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        Documentación Reciente:
                      </div>
                      {repo.documentations.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded border p-3 text-sm"
                        >
                          <div>
                            <div className="font-medium">{doc.commitMessage}</div>
                            <div className="text-xs text-gray-500">
                              {doc.commitSha.substring(0, 7)} •{' '}
                              {new Date(doc.generatedAt).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                          <button className="text-blue-600 hover:underline">
                            Ver
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

#### 6.2. Crear Página de Documentación Individual

Crear archivo: `src/app/dashboard/docs/[id]/page.tsx`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/db';
import ReactMarkdown from 'react-markdown';

export default async function DocumentationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const doc = await prisma.documentation.findUnique({
    where: { id: params.id },
    include: {
      repository: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!doc || doc.repository.user.email !== session.user.email) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <a href="/dashboard" className="text-blue-600 hover:underline">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border bg-white p-8">
          {/* Meta */}
          <div className="mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold">{doc.commitMessage}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>Repositorio: {doc.repository.fullName}</span>
              <span>•</span>
              <span>Commit: {doc.commitSha.substring(0, 7)}</span>
              <span>•</span>
              <span>Autor: {doc.commitAuthor}</span>
              <span>•</span>
              <span>
                {new Date(doc.generatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {doc.type}
              </span>
              <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                {doc.impact} impact
              </span>
            </div>
          </div>

          {/* Documentation Content */}
          <div className="prose prose-gray max-w-none">
            <ReactMarkdown>{doc.content}</ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}
```

#### 6.3. Instalar react-markdown

```bash
pnpm add react-markdown
```

### 🧪 Pruebas de Etapa 6

#### Test 1: Dashboard Básico

1. Inicia: `pnpm dev`
2. Login en `/login`
3. Dashboard debe mostrar:
   - Header con email
   - 3 cards de stats (Repos: 0, Docs: 0, Plan: Free)
   - Mensaje "No tienes repositorios"

#### Test 2: Crear Repo Manualmente

Abre Prisma Studio:

```bash
pnpm db:studio
```

1. Encuentra tu `userId` en tabla `users`
2. Crea un `Repository`:
   - userId: (tu ID)
   - provider: GITHUB
   - externalId: "123"
   - name: "test-repo"
   - fullName: "tu-usuario/test-repo"
   - webhookSecret: "test"
   - isActive: true
3. Recarga dashboard
4. Debe aparecer el repo

#### Test 3: Ver Documentación Generada

1. Haz un commit real en tu repo GitHub
2. Worker procesa → guarda en DB
3. Recarga dashboard
4. Debe aparecer "1 docs generadas"
5. Click en "Ver"
6. Debe mostrar la documentación en Markdown renderizada

### ✅ Criterios de Éxito - Etapa 6

- [ ] Dashboard muestra stats
- [ ] Repositorios aparecen listados
- [ ] Docs recientes de cada repo se ven
- [ ] Click en "Ver" abre la documentación
- [ ] Markdown se renderiza correctamente
- [ ] Meta información es correcta (commit, autor, fecha)

**Si todo ✅ → Avanza a Etapa 7**

---

## Etapa 7: Exportación PDF/HTML

**Objetivo**: Exportar documentación a PDF y HTML (feature clave para freelancers).

### 🛠️ Implementación

#### 7.1. Crear Exportador

Crear archivo: `src/lib/export/pdf.ts`

```typescript
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export async function generatePDF(
  content: string,
  metadata: {
    title: string;
    repository: string;
    commit: string;
    author: string;
    date: Date;
  }
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // HTML template profesional
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
    }
    h3 {
      color: #1e3a8a;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    .meta {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #2563eb;
    }
    .meta-item {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${metadata.title}</h1>
  
  <div class="meta">
    <div class="meta-item"><strong>Repositorio:</strong> ${metadata.repository}</div>
    <div class="meta-item"><strong>Commit:</strong> ${metadata.commit}</div>
    <div class="meta-item"><strong>Autor:</strong> ${metadata.author}</div>
    <div class="meta-item"><strong>Fecha:</strong> ${metadata.date.toLocaleDateString(
      'es-ES',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )}</div>
  </div>

  ${content}

  <div class="footer">
    Generado automáticamente por DocuAI Agent<br>
    ${new Date().toLocaleDateString('es-ES')}
  </div>
</body>
</html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generateHTML(
  content: string,
  metadata: {
    title: string;
    repository: string;
    commit: string;
    author: string;
    date: Date;
  }
): Promise<string> {
  // Mismo HTML que PDF pero retornamos como string
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <style>
    /* Same styles as PDF... */
  </style>
</head>
<body>
  <!-- Same body as PDF... -->
</body>
</html>
  `;
}
```

#### 7.2. Crear API Route para Exportar

Crear archivo: `src/app/api/docs/[id]/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { generatePDF, generateHTML } from '@/lib/export/pdf';
import { marked } from 'marked';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get('format') || 'pdf';

    const doc = await prisma.documentation.findUnique({
      where: { id: params.id },
      include: {
        repository: {
          include: { user: true },
        },
      },
    });

    if (!doc || doc.repository.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const htmlContent = await marked(doc.content);

    const metadata = {
      title: doc.commitMessage,
      repository: doc.repository.fullName,
      commit: doc.commitSha.substring(0, 7),
      author: doc.commitAuthor,
      date: doc.generatedAt,
    };

    if (format === 'pdf') {
      const pdf = await generatePDF(htmlContent, metadata);

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${doc.repository.name}-${doc.commitSha.substring(0, 7)}.pdf"`,
        },
      });
    } else if (format === 'html') {
      const html = await generateHTML(htmlContent, metadata);

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${doc.repository.name}-${doc.commitSha.substring(0, 7)}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
```

#### 7.3. Agregar Botones de Exportación

Actualizar `src/app/dashboard/docs/[id]/page.tsx`:

```typescript
// Agregar después del header:
<div className="flex gap-2">
  <a
    href={`/api/docs/${doc.id}/export?format=pdf`}
    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
  >
    📄 Exportar PDF
  </a>
  <a
    href={`/api/docs/${doc.id}/export?format=html`}
    className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
  >
    🌐 Exportar HTML
  </a>
  <a
    href={`/api/docs/${doc.id}/export?format=markdown`}
    className="rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
  >
    📝 Descargar Markdown
  </a>
</div>
```

### 🧪 Pruebas de Etapa 7

#### Test 1: Exportar PDF

1. Ve a una documentación
2. Click "Exportar PDF"
3. Debe descargar archivo con formato profesional

#### Test 2: Exportar HTML

1. Click "Exportar HTML"
2. Debe descargar archivo HTML standalone

---

## 🚀 Features Futuras / Mejoras Pendientes

### Feature 1: Escritura Automática en Repositorio (Opción Híbrida)

**Estado**: Planificado para post-MVP  
**Prioridad**: Media  
**Complejidad**: Alta

**Descripción:**
Permitir que la documentación generada se escriba automáticamente en el repositorio de GitHub, además de mostrarse en el dashboard.

**Implementación:**

```
Configuración por Repositorio:
├── ☑️ Mostrar en dashboard (siempre activo)
├── ☐ Escribir CHANGELOG.md automáticamente
├── ☐ Crear docs/commits/ con archivos Markdown
└── ☐ Actualizar README.md con últimos cambios
```

**Flujo:**

```
Push a main → Webhook → Análisis + Generación
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              Dashboard (DB)    GitHub Commit (opcional)
                                        ↓
                              docs/
                              ├── changelog.md
                              └── commits/
                                  └── 2026-05-24-feat-login.md
```

**Ventajas:**

- Documentación versionada con Git
- Visible directamente en GitHub
- Historial completo en el repo

**Desventajas:**

- Commits automáticos en el historial
- Conflictos potenciales
- Requiere GitHub App con permisos de escritura
- Mayor complejidad

**Requisitos Técnicos:**

1. GitHub App instalada con permisos `contents:write`
2. API de GitHub para crear/actualizar archivos
3. Manejo de conflictos y race conditions
4. UI de configuración en dashboard

**Implementación Sugerida:**

```typescript
// src/services/github/writer.ts
import { Octokit } from '@octokit/rest';

interface WriteDocOptions {
  owner: string;
  repo: string;
  content: string;
  commitMessage: string;
  branch: string;
}

export async function writeDocToRepo(
  options: WriteDocOptions,
  installationToken: string
) {
  const octokit = new Octokit({ auth: installationToken });

  const path = `docs/commits/${Date.now()}-${slugify(options.commitMessage)}.md`;

  // Obtener SHA del archivo si existe
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: options.owner,
      repo: options.repo,
      path,
    });
    sha = 'sha' in data ? data.sha : undefined;
  } catch (error) {
    // Archivo no existe, se creará
  }

  // Crear o actualizar archivo
  await octokit.repos.createOrUpdateFileContents({
    owner: options.owner,
    repo: options.repo,
    path,
    message: `docs: ${options.commitMessage}`,
    content: Buffer.from(options.content).toString('base64'),
    branch: options.branch,
    sha, // Solo si existe
    committer: {
      name: 'DocuAI Bot',
      email: 'bot@docuai.com',
    },
  });
}
```

**Configuración en Dashboard:**

```typescript
// src/app/dashboard/repos/[id]/settings/page.tsx
export default function RepoSettings() {
  return (
    <form>
      <h2>Configuración de Documentación</h2>

      <label>
        <input type="checkbox" checked disabled />
        Mostrar en Dashboard (siempre activo)
      </label>

      <label>
        <input type="checkbox" name="writeChangelog" />
        Escribir CHANGELOG.md automáticamente
      </label>

      <label>
        <input type="checkbox" name="writeCommitDocs" />
        Crear archivos en docs/commits/
      </label>

      <label>
        <input type="checkbox" name="updateReadme" />
        Actualizar README.md con últimos cambios
      </label>
    </form>
  );
}
```

**Estimación de Tiempo:**

- Backend (GitHub API integration): 2-3 días
- UI de configuración: 1 día
- Testing y manejo de edge cases: 2 días
- **Total: 5-6 días**

**Referencias:**

- [GitHub API - Create or update file contents](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)
- [GitHub Apps - Installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)

---

### Feature 2: Notificaciones por Email/Slack

**Estado**: Planificado  
**Prioridad**: Baja

Notificar al equipo cuando se genere documentación nueva.

---

### Feature 3: Análisis de Cobertura de Código

**Estado**: Idea  
**Prioridad**: Baja

Integrar con herramientas de cobertura para incluir métricas en la documentación.

---

### Feature 4: Análisis Completo de Repositorio (Full Repository Analysis)

**Estado**: Planificado para Fase 2  
**Prioridad**: ALTA  
**Complejidad**: Alta

**Descripción:**
Cuando un nuevo cliente conecta su repositorio existente, generar documentación base completa del proyecto analizando TODO el código, no solo commits futuros.

**Problema que resuelve:**

- Cliente con repo de 6+ meses → Solo documenta commits NUEVOS
- No tiene documentación de funcionalidades existentes
- Necesita contexto completo del proyecto para onboarding

**Solución:**
Sistema de análisis ONE-TIME que genera:

1. README.md principal con overview del proyecto
2. ARCHITECTURE.md con estructura y patrones
3. CHANGELOG.md inicial con commits históricos relevantes
4. API.md con endpoints y contratos (si aplica)

**Flujo de Implementación:**

```
Conectar Repo → Trigger Análisis Completo (opcional)
                        ↓
              ┌─────────┴──────────┐
              ↓                    ↓
        Clone Repo          GitHub API
        (temporal)        (lista archivos)
              ↓                    ↓
              └─────────┬──────────┘
                        ↓
                  Análisis con IA
                  (Claude Sonnet 4)
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    README.md    ARCHITECTURE.md    API.md
        ↓               ↓               ↓
   Guardar en DB como "FULL_ANALYSIS" type
        ↓
   Mostrar en Dashboard separado
```

**Información que extrae el análisis:**

**1. README Principal:**

- Descripción del proyecto
- Tecnologías principales
- Estructura de carpetas
- Cómo ejecutar localmente
- Scripts disponibles

**2. ARCHITECTURE:**

- Patrones de diseño detectados
- Arquitectura (MVC, Clean, Layered, etc.)
- Dependencias clave
- Flujo de datos

**3. API Documentation (si aplica):**

- Endpoints detectados (busca routes, controllers)
- Métodos HTTP
- Payloads esperados
- Respuestas

**4. CHANGELOG Histórico:**

- Últimos 50-100 commits más relevantes
- Agrupados por tipo (features, fixes, breaking)
- Timeline del proyecto

**Implementación Técnica:**

```typescript
// src/services/analysis/full-repo-analyzer.ts
import { Octokit } from '@octokit/rest';
import { ChatAnthropic } from '@langchain/anthropic';

interface FullRepoAnalysisOptions {
  owner: string;
  repo: string;
  githubToken: string;
}

export async function analyzeFullRepository(options: FullRepoAnalysisOptions) {
  const octokit = new Octokit({ auth: options.githubToken });

  // 1. Obtener estructura del proyecto
  const { data: tree } = await octokit.git.getTree({
    owner: options.owner,
    repo: options.repo,
    tree_sha: 'HEAD',
    recursive: '1',
  });

  // 2. Detectar tipo de proyecto (React, Node, Python, etc.)
  const projectType = detectProjectType(tree);

  // 3. Leer archivos clave (package.json, etc.)
  const keyFiles = await readKeyFiles(octokit, options, tree);

  // 4. Analizar con Claude
  const analysis = await analyzeWithAI(projectType, keyFiles, tree);

  // 5. Generar documentos
  const docs = {
    readme: generateReadme(analysis),
    architecture: generateArchitecture(analysis),
    api: generateApiDocs(analysis),
    changelog: await generateHistoricalChangelog(octokit, options),
  };

  // 6. Guardar en DB como documentos especiales
  await saveFullAnalysisDocs(options.repo, docs);

  return docs;
}

function detectProjectType(tree: any[]): ProjectType {
  const hasFile = (name: string) => tree.some((f) => f.path === name);

  if (hasFile('package.json')) return 'NODE_JS';
  if (hasFile('requirements.txt')) return 'PYTHON';
  if (hasFile('pom.xml')) return 'JAVA';
  if (hasFile('go.mod')) return 'GO';
  // ... más detectores

  return 'UNKNOWN';
}

async function analyzeWithAI(
  projectType: ProjectType,
  keyFiles: Record<string, string>,
  tree: any[]
): Promise<ProjectAnalysis> {
  const model = new ChatAnthropic({
    modelName: 'claude-sonnet-4-20250514',
    temperature: 0.2,
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Eres un arquitecto de software experto. Analiza este proyecto y genera documentación completa.

**Tipo de Proyecto**: ${projectType}

**Archivos Clave**:
${Object.entries(keyFiles)
  .map(
    ([name, content]) => `
### ${name}
\`\`\`
${content.substring(0, 2000)}
\`\`\`
`
  )
  .join('\n')}

**Estructura** (${tree.length} archivos):
${tree
  .slice(0, 50)
  .map((f) => f.path)
  .join('\n')}

**TAREA**: Genera un análisis completo con:
1. Descripción del proyecto (qué hace, para quién)
2. Stack tecnológico completo
3. Arquitectura y patrones de diseño
4. Estructura de carpetas explicada
5. Puntos de entrada (main, index, etc.)
6. Dependencias principales y su propósito
7. Flujo de datos (cómo funcionan las features principales)

**FORMATO**: JSON estructurado para generar docs formales.`;

  const response = await model.invoke(prompt);
  return parseAnalysisResponse(response.content.toString());
}
```

**UI en Dashboard:**

```typescript
// Botón en repo conectado
<button onClick={() => triggerFullAnalysis(repoId)}>
  Generar Documentación Base del Proyecto
</button>

// Nueva sección en dashboard
<section>
  <h2>Documentación Base</h2>
  <div>
    <Link href={`/docs/repo/${repoId}/readme`}>📘 README</Link>
    <Link href={`/docs/repo/${repoId}/architecture`}>🏗️ ARQUITECTURA</Link>
    <Link href={`/docs/repo/${repoId}/api`}>🔌 API</Link>
    <Link href={`/docs/repo/${repoId}/changelog`}>📜 CHANGELOG</Link>
  </div>
</section>
```

**Consideraciones:**

**Pros:**

- Contexto completo del proyecto para nuevos devs
- Documentación profesional desde día 1
- Valor INMEDIATO al conectar repo (no esperar commits nuevos)
- Gran diferenciador vs. competencia

**Contras:**

- Consume muchos tokens de Claude (proyecto grande = $$$)
- Toma tiempo (2-5 minutos para proyectos grandes)
- Puede requerir GitHub App con más permisos

**Estrategia de Pricing:**

- Plan Free: NO disponible (muy costoso)
- Plan Starter: 1 análisis completo incluido
- Plan Pro: 5 análisis completos/mes
- Plan Enterprise: Ilimitado

**Estimación de Tiempo:**

- Backend (análisis + generación): 3-4 días
- Integración con GitHub API avanzada: 2 días
- UI y experiencia de usuario: 2 días
- Testing con repos reales: 2 días
- Optimización de prompts: 1-2 días
- **Total: 10-12 días (2 semanas)**

**Prioridad para tu SaaS:**
⭐⭐⭐⭐⭐ CRÍTICO

**Por qué es CRÍTICO:**

- 90% de tus clientes tendrán repos EXISTENTES
- Sin esto, solo documentas "lo nuevo" → valor percibido BAJO
- Con esto, valor percibido ALTO desde minuto 1
- Es la feature que te diferencia de solo "git log bonito"

**Roadmap Sugerido:**

1. ✅ Etapa 7: Export PDF/HTML (ahora)
2. 🔥 Feature 4: Análisis Completo (siguiente prioridad)
3. Etapa 6: Conectar repos desde UI
4. Etapa 5: Queue & Workers

---

**Última actualización**: 24 Mayo 2026 3. Descarga automática 4. Abre el PDF 5. Verifica:

- [ ] Formato profesional
- [ ] Metadata correcta
- [ ] Markdown renderizado
- [ ] Footer con "DocuAI Agent"

#### Test 2: Exportar HTML

1. Click "Exportar HTML"
2. Descarga el archivo
3. Abre en navegador
4. Verifica formato y contenido

#### Test 3: Performance

```bash
# Medir tiempo de generación PDF
time curl "http://localhost:3000/api/docs/ID/export?format=pdf" > test.pdf
# Target: <5 segundos
```

### ✅ Criterios de Éxito - Etapa 7

- [ ] PDF se genera correctamente
- [ ] HTML se genera correctamente
- [ ] Formato es profesional (no "feo")
- [ ] Metadata aparece en el documento
- [ ] Descarga automática funciona
- [ ] Tiempo de generación <5s

**Si todo ✅ → Avanza a Etapa 8**

---

## Etapa 8: GitLab Support

**Objetivo**: Soporte completo para GitLab (mismo flujo que GitHub).

_Esta etapa es similar a Etapa 2-4 pero para GitLab._

### Implementación Resumida

1. Crear webhook handler en `/api/webhooks/gitlab/route.ts`
2. Adaptar analyzer para formato de diff de GitLab
3. Usar `@gitbeaker/node` para API calls
4. Configurar webhook en GitLab project

[Detalles completos disponibles si necesitas]

**Tiempo estimado**: 2-3 días

---

## Etapa 9: Optimización & Producción

**Objetivo**: Preparar para producción con optimizaciones, monitoring y despliegue.

### 9.1. Optimizaciones de Performance

#### Caching de Análisis

```typescript
// Cachear análisis repetidos
import { Redis } from 'ioredis';
const cache = new Redis(process.env.REDIS_URL!);

async function analyzeWithCache(
  message: string,
  files: string[],
  diff: string
) {
  const cacheKey = `analysis:${crypto.createHash('md5').update(diff).digest('hex')}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await analyzeCommit(message, files, diff);
  await cache.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hora

  return result;
}
```

#### Streaming de Generación

```typescript
// Usar streaming para respuestas largas
const chain = promptTemplate.pipe(model);
const stream = await chain.stream(input);

for await (const chunk of stream) {
  // Process chunk
}
```

### 9.2. Monitoring

#### Sentry para Errores

```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

#### Axiom para Logs

```bash
pnpm add next-axiom
```

### 9.3. Deploy a Producción

#### Vercel (Frontend + API)

```bash
vercel --prod
```

Variables de entorno requeridas en Vercel:

- Todas las de `.env.local`
- `NODE_ENV=production`

#### Railway (Workers)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### 9.4. Tests E2E

```bash
pnpm add -D @playwright/test
```

```typescript
// e2e/full-flow.spec.ts
import { test, expect } from '@playwright/test';

test('full documentation flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  // ...

  // 2. Make commit (trigger webhook)
  // ...

  // 3. Wait for processing
  await page.waitForTimeout(30000);

  // 4. Check dashboard
  await page.goto('/dashboard');
  await expect(page.locator('text=1 docs generadas')).toBeVisible();
});
```

### ✅ Criterios de Éxito - Etapa 9

- [ ] Caching implementado
- [ ] Sentry configurado
- [ ] Logs centralizados
- [ ] Deploy exitoso en Vercel
- [ ] Workers corriendo en Railway
- [ ] Tests E2E pasan
- [ ] Performance <2s (p95)
- [ ] Uptime >99.5%

---

## 🎯 Resumen de Tiempos

| Etapa | Duración | Funcionalidad    |
| ----- | -------- | ---------------- |
| 0     | ✅ Done  | Setup base       |
| 1     | 2-3 días | Database & Auth  |
| 2     | 3-4 días | GitHub Webhook   |
| 3     | 4-5 días | AI Analyzer      |
| 4     | 3-4 días | Doc Generator    |
| 5     | 3-4 días | Queue & Workers  |
| 6     | 4-5 días | Dashboard        |
| 7     | 2-3 días | PDF/HTML Export  |
| 8     | 2-3 días | GitLab Support   |
| 9     | 5-7 días | Production Ready |

**Total**: 4-6 semanas para MVP completo

---

## 📊 MVP Mínimo vs Completo

### MVP Mínimo (2-3 semanas)

- Etapas 0-4: Webhook → AI → Docs → DB
- Solo GitHub
- Solo Markdown
- Sin dashboard (solo logs)

### MVP Completo (4-6 semanas)

- Todas las etapas
- Dashboard funcional
- PDF/HTML export
- GitHub + GitLab
- Production ready

---

¿Quieres que profundice en alguna etapa específica?
