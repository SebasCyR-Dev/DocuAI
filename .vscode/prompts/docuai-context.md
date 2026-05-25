# DocuAI Agent - Project Context

## Contexto del Negocio

**DocuAI Agent** es una plataforma SaaS que automatiza la generación de documentación técnica de software mediante IA, dirigida al mercado latinoamericano.

### Propuesta de Valor
- **Automatización completa**: Documentación generada automáticamente en cada commit
- **Integración nativa**: GitHub y GitLab webhooks
- **Formatos múltiples**: Markdown, HTML, PDF profesional
- **Zero manual effort**: Sin intervención del desarrollador

### Segmentos de Cliente
1. **Freelancers** ($9/mes): 2-3 proyectos simultáneos, necesitan PDFs profesionales para clientes
2. **Startups** ($29/mes): 5-15 devs, reducir tiempo de onboarding
3. **Empresas** ($99-300/mes): +15 devs, compliance, soporte enterprise

### Insights del Mercado (Encuesta 49 respuestas)

#### Preocupaciones principales de CTOs:
- 42.1% → **Latencia en CI/CD** (prioridad crítica)
- 36.8% → **Privacidad del código** (comunicar zero data retention)
- 21.1% → Alucinaciones de IA

#### Freelancers:
- 58.8% dedica <5% tiempo a documentar (opportunity cost alto)
- 41.2% identifica "cliente no entiende código" como mayor obstáculo
- 52.9% descubre herramientas via YouTube/blogs técnicos

#### Awareness:
- 56.3% **no conoce** herramientas de doc automática (blue ocean)
- 82.4% pagaría por la solución (validación de mercado)

## Stack Técnico

### Core
- **Next.js 14** (App Router) - Frontend + API
- **LangChain.js** - Agente de IA
- **TypeScript** - Type safety
- **Supabase** - Database + Auth + Storage
- **Prisma ORM** - Type-safe DB queries

### IA & Processing
- **Claude Sonnet 4.5** (Anthropic) - Análisis complejo
- **GPT-4o-mini** (OpenAI) - Análisis rápido de diffs
- **Octokit** - GitHub API
- **@gitbeaker/node** - GitLab API

### Infrastructure
- **BullMQ + Redis** - Background jobs
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend workers

## Principios de Desarrollo

### 1. Privacy First
```typescript
// ✅ NUNCA almacenar código del usuario
// ✅ Process in-memory, discard immediately
// ✅ Logs: metadata only, no code snippets
```

### 2. Performance Obsession
```typescript
// Target: <30s desde commit hasta doc generada
// - Webhook response: <1s
// - Job processing: <25s
// - Save to repo: <4s
```

### 3. Error Resilience
```typescript
// Webhook falló? → Reintentar 3x con backoff
// LLM timeout? → Fallback a modelo más rápido
// Commit sin cambios sustanciales? → Skip inteligentemente
```

### 4. i18n desde día 1
```typescript
// Interfaz: ES/EN
// Docs generadas: detectar idioma del proyecto
// Soporte: priorizar LATAM timezone
```

## Arquitectura de Generación de Docs

### Pipeline
1. **Webhook recibe commit** → Valida signature
2. **Extrae diff** → Identifica archivos cambiados
3. **Clasifica cambio** → Feature/Bug/Refactor/Breaking
4. **Analiza contexto** → Lee archivos relacionados (imports, exports)
5. **Genera documentación** → Claude Sonnet con contexto completo
6. **Formatea output** → Markdown/HTML/PDF según preferencias
7. **Commit o sube** → Según configuración del usuario

### Decisiones de diseño
- **¿Cuándo documentar?**: Solo cambios sustanciales (no typos, formatting)
- **¿Qué documentar?**: Lógica de negocio, decisiones de arquitectura, breaking changes
- **¿Cuánto documentar?**: Conciso pero completo (target: 200-500 palabras por feature)

## Métricas de Éxito

### Producto
- Tiempo promedio de generación < 30s
- Accuracy de clasificación de cambios > 90%
- User satisfaction score (NPS) > 50

### Negocio
- Churn rate < 5% mensual
- Conversión free → paid > 10%
- CAC payback < 6 meses

## Context para Claude al desarrollar

Cuando escribas código para DocuAI:
1. **Prioriza latencia** sobre features complejas
2. **Valida todo input** (webhooks, forms, APIs)
3. **Zero trust** en código del usuario (sandbox execution)
4. **Logs exhaustivos** pero sin información sensible
5. **Tests E2E** para flujo crítico: commit → doc generada
6. **Documentación inline** para decisiones de arquitectura
