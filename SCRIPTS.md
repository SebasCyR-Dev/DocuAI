# Scripts de Utilidad

Scripts útiles para desarrollo y deployment de DocuAI Agent.

## Desarrollo

### Iniciar servidor de desarrollo

```bash
pnpm dev
```

### Verificar tipos TypeScript

```bash
pnpm type-check
```

### Lint y formateo

```bash
# Ejecutar linter
pnpm lint

# Formatear código
pnpm format
```

## Base de Datos

### Generar cliente Prisma después de cambios en schema

```bash
pnpm db:generate
```

### Aplicar cambios al schema (desarrollo)

```bash
pnpm db:push
```

### Crear migración (producción)

```bash
pnpm db:migrate
```

### Abrir Prisma Studio (UI para ver DB)

```bash
pnpm db:studio
```

### Reset completo de base de datos

```bash
# ⚠️ Esto BORRARÁ todos los datos
npx prisma migrate reset
```

## Testing

### Ejecutar tests

```bash
pnpm test
```

### Tests con watch mode

```bash
pnpm test:watch
```

### Coverage

```bash
pnpm test:coverage
```

## Build y Deploy

### Build para producción

```bash
pnpm build
```

### Iniciar en modo producción

```bash
pnpm start
```

### Deploy a Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

## Utilidades

### Actualizar todas las dependencias

```bash
# Ver actualizaciones disponibles
pnpm outdated

# Actualizar todo (cuidado!)
pnpm update --latest

# Actualizar interactivamente
npx taze
```

### Limpiar cache y node_modules

```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules,.next; pnpm install

# Bash/Zsh
rm -rf node_modules .next && pnpm install
```

### Generar secretos aleatorios

```bash
# Para webhook secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Ver uso de dependencias

```bash
# Analizar bundle size
npx @next/bundle-analyzer
```

### Prisma: Ver SQL generado

```bash
npx prisma studio --experimental-studio-preview
```

## Docker (Opcional)

### Redis local

```bash
# Iniciar Redis
docker run -d -p 6379:6379 --name docuai-redis redis:alpine

# Ver logs
docker logs -f docuai-redis

# Detener
docker stop docuai-redis

# Eliminar
docker rm docuai-redis
```

### PostgreSQL local

```bash
# Iniciar PostgreSQL
docker run -d \
  -p 5432:5432 \
  --name docuai-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=docuai \
  postgres:16-alpine

# Detener
docker stop docuai-postgres

# Eliminar
docker rm docuai-postgres
```

## Git Hooks

### Setup Husky (pre-commit hooks)

```bash
# Instalar husky
pnpm add -D husky

# Inicializar
npx husky init

# Agregar pre-commit hook
echo "pnpm lint && pnpm type-check" > .husky/pre-commit
```

## Debugging

### Debug con VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Ver logs de producción (Vercel)

```bash
vercel logs [deployment-url]
```

## Monitoreo

### Analizar performance

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```

### Ver métricas de Next.js

```bash
# Durante dev, abrir:
# http://localhost:3000/__nextjs_original-stack-frame
```

## Tips Rápidos

### Variable de entorno local temporal

```bash
# Ejecutar con env vars sin guardar en .env
ANTHROPIC_API_KEY=sk-... pnpm dev
```

### Regenerar lockfile

```bash
rm pnpm-lock.yaml
pnpm install
```

### Ver árbol de dependencias

```bash
pnpm list
pnpm list --depth=1
```

### Verificar vulnerabilidades

```bash
pnpm audit
pnpm audit --fix
```
