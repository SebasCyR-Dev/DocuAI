# 🎯 Plan de Desarrollo por Etapas - DocuAI Agent

Plan incremental de desarrollo donde cada etapa es **completamente funcional y testeable** antes de pasar a la siguiente.

---

## 📋 Índice de Etapas

1. **[Etapa 0: Setup Base y Validación](#etapa-0-setup-base-y-validación)** (YA COMPLETADA ✅)
2. **[Etapa 1: Database & Auth](#etapa-1-database--auth)** (2-3 días)
3. **[Etapa 2: GitHub Webhook Básico](#etapa-2-github-webhook-básico)** (3-4 días)
4. **[Etapa 3: Agente de IA - Análisis Simple](#etapa-3-agente-de-ia---análisis-simple)** (4-5 días)
5. **[Etapa 4: Generación de Documentación](#etapa-4-generación-de-documentación)** (3-4 días)
6. **[Etapa 5: Queue & Background Jobs](#etapa-5-queue--background-jobs)** (3-4 días)
7. **[Etapa 6: Dashboard de Usuario](#etapa-6-dashboard-de-usuario)** (4-5 días)
8. **[Etapa 7: Exportación PDF/HTML](#etapa-7-exportación-pdfhtml)** (2-3 días)
9. **[Etapa 8: GitLab Support](#etapa-8-gitlab-support)** (2-3 días)
10. **[Etapa 9: Optimización & Producción](#etapa-9-optimización--producción)** (5-7 días)

**Tiempo total estimado**: 4-6 semanas

---

## Etapa 0: Setup Base y Validación

### ✅ Status: COMPLETADA

Ya tienes:

- ✅ Proyecto Next.js + TypeScript
- ✅ 607 dependencias instaladas
- ✅ Prisma schema definido
- ✅ Configuración VS Code
- ✅ Prompts para Claude
- ✅ Documentación base

### 🧪 Prueba Final de Etapa 0

```bash
# 1. Verificar que el proyecto inicia
pnpm dev

# 2. Abrir http://localhost:3000
# Debes ver la landing page

# 3. Verificar TypeScript
pnpm type-check

# 4. Verificar lint
pnpm lint
```

**Criterio de éxito**: Proyecto inicia sin errores ✅

---

## Etapa 1: Database & Auth

**Objetivo**: Tener base de datos funcional + autenticación con Supabase + primer usuario registrado.

### 📦 Qué necesitas obtener

1. **Cuenta Supabase** (gratis)
   - Ve a [supabase.com](https://supabase.com)
   - Crea una cuenta
   - Crea un proyecto nuevo (ej: "docuai-dev")
   - Espera ~2 minutos que se cree

2. **Credenciales de Supabase**
   - En tu proyecto → Settings → API
   - Copia:
     - `Project URL` (ej: https://xxx.supabase.co)
     - `anon/public key`
     - `service_role key` (¡secreto!)

3. **Database URL**
   - Settings → Database → Connection string → URI
   - Formato: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`

### 🛠️ Implementación

#### 1.1. Configurar Variables de Entorno

```bash
# Crear .env.local
cp .env.example .env.local
```

Editar `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_service_role_key

# Database
DATABASE_URL="postgresql://postgres:tu_password@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:tu_password@db.xxx.supabase.co:5432/postgres"
```

#### 1.2. Push Schema a Supabase

```bash
# Generar cliente Prisma
pnpm db:generate

# Push schema (crea tablas)
pnpm db:push

# ¿Funcionó? Deberías ver:
# ✔ Generated Prisma Client
# Your database is now in sync with your Prisma schema
```

#### 1.3. Verificar en Supabase Studio

- Abre tu proyecto en Supabase
- Ve a "Table Editor"
- Deberías ver: `users`, `repositories`, `documentations`, `subscriptions`

#### 1.4. Crear Cliente Supabase

Crear archivo: `src/lib/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Para componentes de cliente
export const supabaseClient = createClientComponentClient();

// Para server actions
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### 1.5. Crear Página de Login

Crear archivo: `src/app/(auth)/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert('¡Revisa tu email!');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Login a DocuAI</h1>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar Magic Link'}
        </button>
      </form>
    </div>
  );
}
```

#### 1.6. Crear Callback Handler

Crear archivo: `src/app/auth/callback/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

#### 1.7. Crear Dashboard Básico

Crear archivo: `src/app/dashboard/page.tsx`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">
        ¡Bienvenido! Email: {session.user.email}
      </p>
      <form action="/auth/signout" method="post">
        <button className="mt-4 rounded bg-red-600 px-4 py-2 text-white">
          Cerrar Sesión
        </button>
      </form>
    </div>
  );
}
```

#### 1.8. Crear Logout Handler

Crear archivo: `src/app/auth/signout/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url));
}
```

### 🧪 Pruebas de Etapa 1

#### Test 1: Database Conectada

```bash
# Abrir Prisma Studio
pnpm db:studio

# Deberías ver las tablas vacías
# Navega en http://localhost:5555
```

#### Test 2: Auth Funciona

1. Inicia: `pnpm dev`
2. Ve a: `http://localhost:3000/login`
3. Ingresa tu email
4. Revisa tu email (puede caer en spam)
5. Haz click en el link
6. Deberías ser redirigido a `/dashboard`
7. Verifica que aparece tu email

#### Test 3: Logout Funciona

1. En dashboard, click "Cerrar Sesión"
2. Te redirige a `/login`
3. Si intentas ir a `/dashboard` sin login → vuelves a `/login`

#### Test 4: Usuario en DB

```bash
# Abrir Prisma Studio
pnpm db:studio

# Ve a tabla "users" (puede estar en auth.users en Supabase)
# Deberías ver tu usuario registrado
```

### ✅ Criterios de Éxito - Etapa 1

- [ ] Supabase proyecto creado
- [ ] Variables de entorno configuradas
- [ ] Schema pusheado a DB (tablas creadas)
- [ ] Login con magic link funciona
- [ ] Logout funciona
- [ ] Dashboard protegido (redirect si no auth)
- [ ] Usuario visible en DB

**Si todo ✅ → Avanza a Etapa 2**

---

## Etapa 2: GitHub Webhook Básico

**Objetivo**: Recibir webhooks de GitHub cuando haces un commit y loggear la información.

### 📦 Qué necesitas obtener

1. **Cuenta GitHub** (ya tienes)
2. **ngrok o similar** (para testing local)
3. **Repositorio de prueba** (crea uno nuevo)

### 🛠️ Implementación

#### 2.1. Instalar ngrok

```bash
# Windows (con Chocolatey)
choco install ngrok

# O descargar de https://ngrok.com/download
```

#### 2.2. Configurar ngrok

```bash
# Crear cuenta en ngrok.com
# Copiar authtoken

ngrok authtoken TU_AUTHTOKEN
```

#### 2.3. Crear Webhook Handler

Crear archivo: `src/app/api/webhooks/github/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Verificar signature de GitHub
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'desarrollo-secreto';
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Leer body como texto
    const body = await req.text();

    // 2. Verificar signature (si existe)
    const signature = req.headers.get('x-hub-signature-256');
    if (signature && !verifySignature(body, signature)) {
      console.error('❌ Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parse payload
    const payload = JSON.parse(body);

    // 4. Log información del commit
    console.log('🎉 Webhook recibido!');
    console.log('📦 Repo:', payload.repository?.full_name);
    console.log('🌿 Branch:', payload.ref);
    console.log('👤 Autor:', payload.head_commit?.author?.name);
    console.log('💬 Mensaje:', payload.head_commit?.message);
    console.log(
      '📝 Archivos modificados:',
      payload.head_commit?.modified?.length || 0
    );

    // 5. Guardar en DB (para probar)
    // TODO: En siguiente etapa aquí encolaremos el job

    return NextResponse.json({
      received: true,
      message: 'Webhook procesado exitosamente',
      commit: payload.head_commit?.id,
    });
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GitHub webhook endpoint ready',
  });
}
```

#### 2.4. Agregar Variable de Entorno

En `.env.local`:

```env
GITHUB_WEBHOOK_SECRET=desarrollo-secreto-123
```

#### 2.5. Iniciar ngrok

```bash
# En una terminal separada
ngrok http 3000

# Copia la URL que aparece (ej: https://abc123.ngrok.io)
```

#### 2.6. Configurar Webhook en GitHub

1. Ve a tu repositorio de prueba en GitHub
2. Settings → Webhooks → Add webhook
3. **Payload URL**: `https://tu-url-ngrok.io/api/webhooks/github`
4. **Content type**: `application/json`
5. **Secret**: `desarrollo-secreto-123` (mismo que .env.local)
6. **Events**: Selecciona "Just the push event"
7. Click "Add webhook"

#### 2.7. Verificar Health Check

```bash
# En otra terminal
curl http://localhost:3000/api/webhooks/github

# Deberías ver:
# {"status":"ok","message":"GitHub webhook endpoint ready"}
```

### 🧪 Pruebas de Etapa 2

#### Test 1: Webhook Health Check

```bash
curl http://localhost:3000/api/webhooks/github
# Debe retornar: {"status":"ok",...}
```

#### Test 2: Test Manual del Webhook

Crear archivo: `test-webhook.json`

```json
{
  "ref": "refs/heads/main",
  "repository": {
    "id": 123,
    "full_name": "tu-usuario/test-repo"
  },
  "head_commit": {
    "id": "abc123",
    "message": "Test commit",
    "author": {
      "name": "Tu Nombre"
    },
    "modified": ["src/test.ts"]
  }
}
```

Enviar webhook:

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d @test-webhook.json

# Deberías ver en la consola de pnpm dev:
# 🎉 Webhook recibido!
# 📦 Repo: tu-usuario/test-repo
# ...
```

#### Test 3: Webhook Real desde GitHub

1. Asegúrate que `pnpm dev` y `ngrok http 3000` están corriendo
2. Ve a tu repo de prueba
3. Edita cualquier archivo (ej: README.md)
4. Haz commit desde GitHub UI
5. Observa la consola de `pnpm dev`
6. Deberías ver el log del webhook

#### Test 4: Verificar en GitHub

- Ve a Settings → Webhooks
- Click en tu webhook
- Ve a "Recent Deliveries"
- Deberías ver el último delivery con ✅ verde
- Click para ver detalles del request/response

### 🐛 Troubleshooting Etapa 2

**Problema: ngrok no funciona**

```bash
# Alternativa: usa localtunnel
npm install -g localtunnel
lt --port 3000
```

**Problema: Webhook no llega**

- Verifica que ngrok esté corriendo
- Verifica que la URL en GitHub es correcta
- Revisa "Recent Deliveries" en GitHub para ver errores

**Problema: Invalid signature**

- Verifica que `GITHUB_WEBHOOK_SECRET` en .env.local es igual al Secret en GitHub

### ✅ Criterios de Éxito - Etapa 2

- [ ] ngrok instalado y corriendo
- [ ] Health check funciona (`/api/webhooks/github` GET)
- [ ] Test manual con curl funciona
- [ ] Webhook configurado en GitHub
- [ ] Commit real desde GitHub → logs aparecen en consola
- [ ] "Recent Deliveries" en GitHub muestra ✅

**Si todo ✅ → Avanza a Etapa 3**

---

## Etapa 3: Agente de IA - Análisis Simple

**Objetivo**: Crear un agente de IA que analice un diff de commit y determine si debe documentarse.

### 📦 Qué necesitas obtener

1. **Anthropic API Key** (Claude)
   - Ve a [console.anthropic.com](https://console.anthropic.com)
   - Crea cuenta
   - Settings → API Keys → Create Key
   - Copia la key (empieza con `sk-ant-api03-...`)

### 🛠️ Implementación

#### 3.1. Configurar API Key

En `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui
```

#### 3.2. Crear Analyzer Chain

Crear archivo: `src/lib/langchain/analyzer.ts`

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { CommitAnalysis } from '@/types';

// Schema de output
const analysisSchema = z.object({
  type: z.enum([
    'feature',
    'fix',
    'refactor',
    'breaking',
    'docs',
    'test',
    'skip',
  ]),
  impact: z.enum(['high', 'medium', 'low']),
  shouldDocument: z.boolean(),
  reasoning: z.string(),
});

// Modelo Claude
const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4.5',
  temperature: 0.2,
  maxTokens: 1024,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Parser estructurado
const parser = StructuredOutputParser.fromZodSchema(analysisSchema);

// Prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
Eres un experto en análisis de commits de Git. Analiza el siguiente commit y determina:
1. Tipo de cambio
2. Nivel de impacto
3. Si requiere documentación técnica

REGLAS:
- "skip" para cambios triviales (typos, formato, spacing)
- "breaking" si cambia interfaces públicas o APIs
- "high" impact para cambios de arquitectura, seguridad o API
- Solo shouldDocument=true si hay lógica de negocio nueva o cambios importantes

COMMIT MESSAGE:
{message}

ARCHIVOS MODIFICADOS:
{files}

DIFF (primeras líneas):
{diff}

{format_instructions}

Responde SOLO con el JSON, sin texto adicional.
`);

export async function analyzeCommit(
  message: string,
  files: string[],
  diff: string
): Promise<CommitAnalysis> {
  try {
    const chain = promptTemplate.pipe(model).pipe(parser);

    const result = await chain.invoke({
      message,
      files: files.join('\n'),
      diff: diff.substring(0, 2000), // Primeros 2000 chars
      format_instructions: parser.getFormatInstructions(),
    });

    console.log('🤖 AI Analysis:', result);

    return {
      ...result,
      contextFiles: [], // Por ahora vacío
    };
  } catch (error) {
    console.error('❌ Error en análisis IA:', error);
    throw error;
  }
}
```

#### 3.3. Crear Test del Analyzer

Crear archivo: `src/lib/langchain/analyzer.test.ts`

```typescript
import { analyzeCommit } from './analyzer';

// Test cases
const testCases = [
  {
    name: 'Feature: Nueva funcionalidad',
    message: 'feat: add user authentication',
    files: ['src/auth/login.ts', 'src/types/user.ts'],
    diff: `
+ export function authenticateUser(email: string, password: string) {
+   return validateCredentials(email, password);
+ }
`,
    expected: {
      type: 'feature',
      shouldDocument: true,
      impact: 'high',
    },
  },
  {
    name: 'Fix: Bug menor',
    message: 'fix: correct typo in variable name',
    files: ['src/utils.ts'],
    diff: `
- const userName = 'test';
+ const username = 'test';
`,
    expected: {
      type: 'skip',
      shouldDocument: false,
      impact: 'low',
    },
  },
  {
    name: 'Refactor: Reestructuración',
    message: 'refactor: extract helper function',
    files: ['src/helpers/format.ts'],
    diff: `
- const formatted = data.map(d => d.toUpperCase());
+ const formatted = data.map(formatData);
+ function formatData(d) { return d.toUpperCase(); }
`,
    expected: {
      type: 'refactor',
      shouldDocument: false,
      impact: 'low',
    },
  },
];

async function runTests() {
  console.log('🧪 Running AI Analyzer Tests...\n');

  for (const test of testCases) {
    console.log(`📝 Test: ${test.name}`);
    console.log(`Message: ${test.message}`);

    try {
      const result = await analyzeCommit(test.message, test.files, test.diff);

      console.log('✅ Result:', {
        type: result.type,
        shouldDocument: result.shouldDocument,
        impact: result.impact,
        reasoning: result.reasoning.substring(0, 100) + '...',
      });

      // Verificar expectativas
      const matches = {
        type: result.type === test.expected.type,
        shouldDocument: result.shouldDocument === test.expected.shouldDocument,
        impact: result.impact === test.expected.impact,
      };

      if (Object.values(matches).every((m) => m)) {
        console.log('✅ TEST PASSED\n');
      } else {
        console.log('⚠️  TEST FAILED - Mismatch:', matches, '\n');
      }
    } catch (error) {
      console.error('❌ TEST ERROR:', error);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests();
}
```

#### 3.4. Integrar Analyzer en Webhook

Actualizar `src/app/api/webhooks/github/route.ts`:

```typescript
import { analyzeCommit } from '@/lib/langchain/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (signature && !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    console.log('🎉 Webhook recibido!');
    console.log('📦 Repo:', payload.repository?.full_name);

    // ✨ NUEVO: Analizar con IA
    const commit = payload.head_commit;
    if (commit) {
      const analysis = await analyzeCommit(
        commit.message,
        [...(commit.added || []), ...(commit.modified || [])],
        JSON.stringify(commit, null, 2) // Usamos el commit completo como "diff"
      );

      console.log('🤖 Análisis IA:', analysis);

      if (analysis.shouldDocument) {
        console.log('✅ Este commit DEBE documentarse');
        // TODO: Aquí encolaremos el job de generación
      } else {
        console.log('⏭️  Commit skipped:', analysis.reasoning);
      }
    }

    return NextResponse.json({
      received: true,
      analyzed: !!commit,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 🧪 Pruebas de Etapa 3

#### Test 1: Verificar API Key

```bash
# Crear script test
node -e "console.log(process.env.ANTHROPIC_API_KEY ? '✅ API Key configurada' : '❌ Falta API Key')"
```

#### Test 2: Test Unitario del Analyzer

```bash
# Ejecutar test
npx tsx src/lib/langchain/analyzer.test.ts

# Deberías ver:
# 🧪 Running AI Analyzer Tests...
# 📝 Test: Feature: Nueva funcionalidad
# ✅ Result: ...
# ✅ TEST PASSED
```

#### Test 3: Webhook con Análisis IA

1. Asegúrate que `ANTHROPIC_API_KEY` está en `.env.local`
2. Reinicia: `pnpm dev`
3. ngrok debe estar corriendo
4. Haz un commit en tu repo de prueba GitHub
5. Observa la consola:
   - Debe ver "🤖 Análisis IA:"
   - Debe mostrar type, impact, shouldDocument
   - Debe mostrar reasoning

#### Test 4: Diferentes Tipos de Commits

Prueba con diferentes commits:

```bash
# Feature
echo "// Nueva función" >> test.js
git add . && git commit -m "feat: add new feature" && git push

# Fix
echo "// Bugfix" >> test.js
git add . && git commit -m "fix: correct bug" && git push

# Skip (typo)
git commit --allow-empty -m "fix: typo in comment" && git push
```

Observa que el análisis IA distingue correctamente cada tipo.

### ✅ Criterios de Éxito - Etapa 3

- [ ] Anthropic API Key configurada
- [ ] Test unitario del analyzer pasa
- [ ] Webhook recibe commit y analiza con IA
- [ ] Logs muestran análisis correcto
- [ ] IA distingue entre feature/fix/skip correctamente
- [ ] `shouldDocument` es true/false según corresponde

**Si todo ✅ → Avanza a Etapa 4**

---

## Etapa 4: Generación de Documentación

**Objetivo**: Generar documentación en Markdown basada en el análisis del commit.

### 🛠️ Implementación

#### 4.1. Crear Documentation Generator

Crear archivo: `src/lib/langchain/generator.ts`

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import type { CommitAnalysis, DocumentationInput } from '@/types';

const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4.5',
  temperature: 0.3, // Un poco más creativo
  maxTokens: 2048,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const promptTemplate = PromptTemplate.fromTemplate(`
Eres un experto en documentación técnica de software. Genera documentación clara y concisa.

INFORMACIÓN DEL COMMIT:
- Repositorio: {repoName}
- Commit: {commitSha}
- Autor: {author}
- Mensaje: {message}
- Tipo: {type}
- Impacto: {impact}

ARCHIVOS MODIFICADOS:
{files}

ANÁLISIS:
{reasoning}

TAREA:
Genera documentación técnica en Markdown que explique:
1. ¿Qué se cambió?
2. ¿Por qué es importante?
3. Impacto en el sistema
4. (Si aplica) Ejemplo de uso o breaking changes

FORMATO:
- Usa headers apropiados (##, ###)
- Incluye código de ejemplo si es relevante
- Sé conciso pero completo (200-400 palabras)
- Lenguaje profesional en español

DOCUMENTACIÓN:
`);

export async function generateDocumentation(
  input: DocumentationInput
): Promise<string> {
  try {
    const chain = promptTemplate.pipe(model);

    const result = await chain.invoke({
      repoName: input.repository.fullName,
      commitSha: input.commit.sha.substring(0, 7),
      author: input.commit.author,
      message: input.commit.message,
      type: input.analysis.type,
      impact: input.analysis.impact,
      files: input.commit.diff.substring(0, 1500),
      reasoning: input.analysis.reasoning,
    });

    const documentation = result.content as string;
    console.log(
      '📝 Documentación generada:',
      documentation.substring(0, 200) + '...'
    );

    return documentation;
  } catch (error) {
    console.error('❌ Error generando documentación:', error);
    throw error;
  }
}
```

#### 4.2. Guardar Documentación en DB

Crear archivo: `src/services/documentation/save.ts`

```typescript
import prisma from '@/lib/db';
import type { CommitAnalysis } from '@/types';

export async function saveDocumentation(data: {
  repositoryId: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  analysis: CommitAnalysis;
  content: string;
}) {
  try {
    const doc = await prisma.documentation.create({
      data: {
        repositoryId: data.repositoryId,
        commitSha: data.commitSha,
        commitMessage: data.commitMessage,
        commitAuthor: data.commitAuthor,
        type: data.analysis.type.toUpperCase() as any,
        impact: data.analysis.impact.toUpperCase() as any,
        format: 'MARKDOWN',
        content: data.content,
        metadata: {
          reasoning: data.analysis.reasoning,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    console.log('💾 Documentación guardada:', doc.id);
    return doc;
  } catch (error) {
    console.error('❌ Error guardando documentación:', error);
    throw error;
  }
}
```

#### 4.3. Integrar en Webhook

Actualizar `src/app/api/webhooks/github/route.ts`:

```typescript
import { analyzeCommit } from '@/lib/langchain/analyzer';
import { generateDocumentation } from '@/lib/langchain/generator';
import { saveDocumentation } from '@/services/documentation/save';

export async function POST(req: NextRequest) {
  try {
    // ... código anterior ...

    const commit = payload.head_commit;
    if (commit) {
      // 1. Analizar
      const analysis = await analyzeCommit(
        commit.message,
        [...(commit.added || []), ...(commit.modified || [])],
        JSON.stringify(commit, null, 2)
      );

      console.log('🤖 Análisis:', analysis);

      if (analysis.shouldDocument) {
        console.log('✅ Generando documentación...');

        // 2. Generar documentación
        const documentation = await generateDocumentation({
          repository: {
            id: payload.repository.id.toString(),
            name: payload.repository.name,
            fullName: payload.repository.full_name,
            provider: 'github',
          },
          commit: {
            sha: commit.id,
            message: commit.message,
            author: commit.author.name,
            timestamp: new Date(commit.timestamp),
            diff: JSON.stringify(commit, null, 2),
          },
          analysis,
        });

        // 3. Guardar en DB
        // TODO: Primero necesitas crear un registro de Repository
        // Por ahora solo logueamos
        console.log('📝 Documentación:', documentation);
      } else {
        console.log('⏭️  Skipped:', analysis.reasoning);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 🧪 Pruebas de Etapa 4

#### Test 1: Generación Manual

Crear archivo: `test-generator.ts` en raíz:

```typescript
import { generateDocumentation } from './src/lib/langchain/generator';

const testInput = {
  repository: {
    id: '123',
    name: 'test-repo',
    fullName: 'usuario/test-repo',
    provider: 'github' as const,
  },
  commit: {
    sha: 'abc123def',
    message: 'feat: add user authentication system',
    author: 'Developer',
    timestamp: new Date(),
    diff: `
+ export function authenticateUser(credentials: UserCredentials) {
+   const { email, password } = credentials;
+   return validateAndLogin(email, password);
+ }
`,
  },
  analysis: {
    type: 'feature' as const,
    impact: 'high' as const,
    shouldDocument: true,
    reasoning: 'Nueva funcionalidad de autenticación que cambia flujo de login',
    contextFiles: [],
  },
};

generateDocumentation(testInput)
  .then((doc) => {
    console.log('📄 DOCUMENTACIÓN GENERADA:\n');
    console.log(doc);
  })
  .catch(console.error);
```

Ejecutar:

```bash
npx tsx test-generator.ts
```

Deberías ver documentación en Markdown generada.

#### Test 2: Webhook End-to-End

1. Haz un commit significativo en tu repo de prueba:

```bash
echo "export function newFeature() { return 'test'; }" > feature.js
git add . && git commit -m "feat: add new feature function" && git push
```

2. Observa la consola de `pnpm dev`:
   - ✅ Webhook recibido
   - ✅ Análisis IA
   - ✅ `shouldDocument: true`
   - ✅ Documentación generada
   - ✅ Markdown visible en logs

#### Test 3: Calidad de la Documentación

Verifica que la documentación generada contiene:

- [ ] Headers apropiados (##, ###)
- [ ] Explicación de qué cambió
- [ ] Por qué es importante
- [ ] Impacto en el sistema
- [ ] Formato Markdown correcto

### ✅ Criterios de Éxito - Etapa 4

- [ ] Generator crea documentación en Markdown
- [ ] Test manual del generator funciona
- [ ] Webhook completo: recibe → analiza → genera docs
- [ ] Documentación es legible y útil
- [ ] Logs muestran documentación generada

**Si todo ✅ → Avanza a Etapa 5**

---

## Etapa 5: Queue & Background Jobs

**Objetivo**: Procesar commits de forma asíncrona con BullMQ para no bloquear el webhook.

### 📦 Qué necesitas

**Redis** (opciones):

**Opción A: Docker (recomendado para desarrollo)**

```bash
docker run -d -p 6379:6379 --name docuai-redis redis:alpine
```

**Opción B: Upstash (gratis, cloud)**

- Ve a [upstash.com](https://upstash.com)
- Crea cuenta
- Create Database (Redis)
- Copia la URL de conexión

### 🛠️ Implementación

[Continuará en siguiente mensaje por límite de caracteres...]

### ⏱️ Tiempo Estimado Total

- Etapa 0: ✅ Completada
- Etapa 1: 2-3 días
- Etapa 2: 3-4 días
- Etapa 3: 4-5 días
- Etapa 4: 3-4 días
- Etapas 5-9: Ver continuación...

**Total MVP básico (Etapas 0-4)**: ~2 semanas

¿Quieres que continúe con las Etapas 5-9 en detalle?
