# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Setup Inicial - 2026-05-23

#### Added

- Estructura base del proyecto con Next.js 14 + TypeScript
- Configuración de Tailwind CSS y PostCSS
- Esquema de base de datos con Prisma (PostgreSQL)
- Sistema de tipos TypeScript para análisis de commits y documentación
- Configuración de ESLint + Prettier
- Extensiones recomendadas de VS Code
- Snippets personalizados para desarrollo rápido
- Prompts especializados para Claude en `.vscode/prompts/`:
  - `langchain-expert.md` - Guía para LangChain.js
  - `docuai-context.md` - Contexto del proyecto
  - `commit-analyzer.md` - Análisis de commits
  - `typescript-expert.md` - Best practices TypeScript
- Documentación inicial:
  - README.md completo con descripción del proyecto
  - CONTRIBUTING.md con guías de contribución
  - LICENSE (MIT)
  - docs/ARCHITECTURE.md con arquitectura técnica detallada
  - docs/INFORME_ACADEMICO.md con contexto del estudio de mercado
  - NEXT_STEPS.md con roadmap y guía de desarrollo
- Utilidades base:
  - `src/lib/utils.ts` - Helpers generales
  - `src/lib/db.ts` - Cliente Prisma singleton
  - `src/lib/errors.ts` - Clases de error personalizadas
  - `src/lib/config.ts` - Constantes de configuración
- Página de inicio temporal con descripción del proyecto

#### Dependencies

- Framework: next@14.2.35, react@18.3.1, react-dom@18.3.1
- IA: @langchain/anthropic@0.3.34, @langchain/openai@0.3.17, langchain@0.3.37
- Database: @prisma/client@5.22.0, @supabase/supabase-js@2.106.1
- Queue: bullmq@5.77.1, ioredis@5.10.1
- Integrations: @octokit/rest@21.1.1, @gitbeaker/node@35.8.1
- Validation: zod@3.25.76
- Styling: tailwindcss@3.4.19, clsx@2.1.1, tailwind-merge@2.6.1
- Utils: markdown-it@14.1.1, puppeteer@23.11.1, date-fns@3.6.0

#### Changed

- N/A (versión inicial)

#### Deprecated

- N/A

#### Removed

- N/A

#### Fixed

- N/A

#### Security

- Configuración de headers de seguridad en next.config.mjs
- Sistema de validación de webhooks preparado
- Zero data retention policy establecida

---

## Formato de Entradas

### Added

Para nuevas funcionalidades

### Changed

Para cambios en funcionalidades existentes

### Deprecated

Para funcionalidades que serán removidas próximamente

### Removed

Para funcionalidades removidas

### Fixed

Para corrección de bugs

### Security

Para vulnerabilidades de seguridad
