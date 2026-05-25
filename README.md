# DocuAI Agent 🤖

> Documentación técnica automática con IA para equipos de desarrollo en Latinoamérica

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-green)](https://js.langchain.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 ¿Qué es DocuAI Agent?

DocuAI Agent es una plataforma SaaS que automatiza por completo la generación y actualización de documentación técnica de software. Se integra directamente a tu flujo de desarrollo mediante webhooks de GitHub y GitLab, analizando cada commit con inteligencia artificial y generando documentación contextual en tiempo real.

### ✨ Características principales

- 🔄 **Automatización completa**: Documenta automáticamente cada commit sin intervención manual
- 🔗 **Integración nativa**: GitHub y GitLab webhooks + CI/CD pipelines
- 🧠 **IA avanzada**: Powered by Claude Sonnet 4.5 (Anthropic) + GPT-4
- 📄 **Multi-formato**: Exporta a Markdown, HTML y PDF profesional
- 🔒 **Zero data retention**: Tu código nunca se almacena, procesamiento en memoria
- ⚡ **Latencia optimizada**: <30s desde commit hasta documentación generada
- 🌎 **LATAM-first**: Precios y soporte adaptados al mercado latinoamericano

## 🎯 ¿Para quién?

### Freelancers

- Genera PDFs profesionales para entregar a clientes
- Ahorra tiempo documentando proyectos
- Desde $9/mes

### Startups

- Reduce tiempo de onboarding de nuevos devs
- Mantén documentación siempre actualizada
- Escala tu equipo sin perder conocimiento técnico
- Desde $29/mes

### Empresas

- Compliance y auditorías
- Soporte post-entrega eficiente
- Integración on-premise disponible
- Desde $99/mes

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router) + TypeScript
- **IA**: LangChain.js + Claude Sonnet 4.5 + GPT-4o-mini
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Prisma
- **Queue**: BullMQ + Redis
- **Integrations**: Octokit (GitHub), GitBeaker (GitLab)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (frontend) + Railway (workers)

## 🚦 Empezar

### 👉 Primera Vez Aquí

**Lee [START_HERE.md](START_HERE.md)** - Tu guía completa paso a paso

Este archivo contiene:

- ✅ Plan de desarrollo por sesiones (4 sesiones = 1 semana)
- ✅ Pasos exactos para cada etapa
- ✅ Links a todos los recursos necesarios
- ✅ **Resultado**: MVP funcional en 1 semana

### 📚 Navegación Rápida

- **[INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md)** - Índice de todos los documentos
- **[RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md)** - Overview completo del proyecto
- **[PLAN_DESARROLLO.md](PLAN_DESARROLLO.md)** - Plan detallado Etapas 1-4
- **[CHECKLIST_PROGRESO.md](CHECKLIST_PROGRESO.md)** - Trackea tu progreso

### ⚡ Ejecución Rápida (Solo ver UI)

Si solo quieres ver la landing page:

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/docuai.git
cd docuai

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus keys

# Generar cliente Prisma
pnpm db:generate

# Push schema a DB
pnpm db:push

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
docuai/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes (webhooks, etc)
│   │   ├── (auth)/         # Rutas autenticadas
│   │   └── (public)/       # Rutas públicas
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes base (shadcn)
│   │   └── features/      # Componentes de features
│   ├── lib/               # Librerías y utilidades
│   │   ├── langchain/    # Agente de IA y chains
│   │   ├── github/       # Integración GitHub
│   │   ├── gitlab/       # Integración GitLab
│   │   └── db/           # Cliente Prisma
│   ├── services/          # Lógica de negocio
│   │   ├── documentation/ # Generación de docs
│   │   ├── webhooks/     # Procesamiento webhooks
│   │   └── queue/        # Jobs en background
│   └── types/            # Tipos TypeScript globales
├── prisma/
│   └── schema.prisma     # Schema de base de datos
├── .vscode/
│   ├── prompts/          # Prompts para Claude
│   └── settings.json     # Configuración del editor
└── public/               # Assets estáticos
```

## 🔧 Scripts Disponibles

```bash
pnpm dev          # Desarrollo local
pnpm build        # Build producción
pnpm start        # Iniciar servidor producción
pnpm lint         # Linter
pnpm type-check   # Verificar tipos TypeScript
pnpm format       # Formatear código con Prettier
pnpm db:generate  # Generar cliente Prisma
pnpm db:push      # Push schema a DB (dev)
pnpm db:migrate   # Crear migración
pnpm db:studio    # Abrir Prisma Studio
```

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en modo watch
pnpm test:watch
```

## 📚 Documentación

### 🚀 Para Empezar

- **[START_HERE.md](START_HERE.md)** ← **Empieza aquí mañana**
- [PLAN_DESARROLLO.md](PLAN_DESARROLLO.md) - Plan detallado por etapas (Etapas 0-4)
- [PLAN_DESARROLLO_5-9.md](PLAN_DESARROLLO_5-9.md) - Etapas avanzadas (5-9)
- [CHECKLIST_PROGRESO.md](CHECKLIST_PROGRESO.md) - Trackea tu progreso

### 📖 Referencia

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura técnica completa
- [docs/INFORME_ACADEMICO.md](docs/INFORME_ACADEMICO.md) - Contexto del estudio de mercado
- [SCRIPTS.md](SCRIPTS.md) - Comandos útiles
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guía de contribución

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee nuestra [Guía de Contribución](CONTRIBUTING.md) antes de hacer un PR.

### Desarrollo local

1. Fork del repositorio
2. Crea una branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la branch: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📊 Roadmap

### MVP (Q2 2026)

- [x] Setup proyecto base
- [ ] Integración GitHub webhooks
- [ ] Agente de IA básico (análisis de commits)
- [ ] Generación de Markdown
- [ ] Dashboard usuario
- [ ] Sistema de auth

### v0.2 (Q3 2026)

- [ ] Integración GitLab
- [ ] Generación de PDFs
- [ ] Exportación HTML
- [ ] Sistema de billing (Stripe)
- [ ] Soporte i18n (ES/EN)

### v1.0 (Q4 2026)

- [ ] API pública
- [ ] Marketplace GitHub App
- [ ] CLI tool
- [ ] Templates personalizables
- [ ] Analytics & insights

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 💬 Comunidad y Soporte

- 📧 Email: [soporte@docuai.app](mailto:soporte@docuai.app)
- 💬 Discord: [Únete a la comunidad](https://discord.gg/docuai)
- 🐦 Twitter: [@DocuAI_App](https://twitter.com/DocuAI_App)
- 📖 Docs: [docs.docuai.app](https://docs.docuai.app)

## 🌟 Agradecimientos

- [LangChain](https://js.langchain.com/) por el framework de IA
- [Anthropic](https://www.anthropic.com/) por Claude
- [Vercel](https://vercel.com/) por Next.js
- La comunidad tech de Bolivia 🇧🇴

---

**Hecho con ❤️ en Santa Cruz, Bolivia para desarrolladores de Latinoamérica**
