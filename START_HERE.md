# 🚀 Guía de Inicio Rápido - Comenzar Mañana

## Por Dónde Empezar

¡Tienes todo listo! Aquí está tu plan de acción para empezar a desarrollar DocuAI.

---

## 📅 Sesión 1: Database & Auth (2-3 horas)

### Paso 1: Crear Cuenta Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Sign up (usa GitHub para más rápido)
3. New Project:
   - Name: `docuai-dev`
   - Database Password: **Guarda esta contraseña** 🔑
   - Region: South America (más cercano)
   - Pricing: Free tier

4. Espera ~2 minutos que se cree

### Paso 2: Copiar Credenciales

En tu proyecto Supabase → Settings → API:

```env
# Copia estos 3 valores
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Settings → Database → Connection String → URI:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.xxx.supabase.co:5432/postgres"
```

### Paso 3: Configurar Proyecto

```bash
# 1. Crear .env.local
cp .env.example .env.local

# 2. Editar .env.local con tus credenciales de Supabase
# (usa VSCode: code .env.local)

# 3. Push schema a database
pnpm db:generate
pnpm db:push

# ✅ Debes ver:
# ✔ Generated Prisma Client
# Your database is now in sync with your Prisma schema
```

### Paso 4: Verificar Database

```bash
# Abrir Prisma Studio
pnpm db:studio

# Se abre http://localhost:5555
# Deberías ver 4 tablas: users, repositories, documentations, subscriptions
```

### Paso 5: Probar Auth

```bash
# Iniciar proyecto
pnpm dev

# Abrir http://localhost:3000/login
# Ingresa tu email
# Revisa tu email (puede caer en spam)
# Click en el link
# ✅ Deberías ir a /dashboard
```

**✅ Checkpoint**: Si ves el dashboard con tu email, ¡perfecto!

---

## 📅 Sesión 2: GitHub Webhook (2-3 horas)

### Paso 1: Instalar ngrok

```bash
# Windows (PowerShell como Admin)
choco install ngrok

# O descargar de: https://ngrok.com/download
# Si ya tienes ngrok.exe descargado en C:\Users\HP\ngrok\
# Agregar al PATH (PowerShell normal):
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\Users\HP\ngrok", "User")
# Luego cierra y abre PowerShell
```

### Paso 2: Configurar ngrok

1. Crear cuenta en [ngrok.com](https://ngrok.com)
2. Dashboard → Your Authtoken → Copy
3. En terminal:

```bash
ngrok authtoken TU_TOKEN_AQUI
```

### Paso 3: Crear Repo de Prueba

En GitHub:

1. New Repository
2. Name: `docuai-test`
3. Public
4. Initialize with README
5. Create

### Paso 4: Configurar Webhook

Terminal 1:

```bash
pnpm dev
```

Terminal 2:

```bash
ngrok http 3000

# Copia la URL (ej: https://abc123.ngrok.io)
```

En GitHub → tu repo → Settings → Webhooks → Add webhook:

- Payload URL: `https://abc123.ngrok.io/api/webhooks/github`
- Content type: `application/json`
- Secret: `desarrollo-secreto-123`
- Events: "Just the push event"
- Active: ✅
- Add webhook

### Paso 5: Probar

1. En tu repo, edita README.md desde GitHub
2. Haz commit
3. Observa la consola de `pnpm dev`:
   ```
   🎉 Webhook recibido!
   📦 Repo: tu-usuario/docuai-test
   👤 Autor: Tu Nombre
   💬 Mensaje: Update README.md
   ```

**✅ Checkpoint**: Si ves logs en consola, ¡perfecto!

---

## 📅 Sesión 3: Agente de IA (3-4 horas)

### Paso 1: Obtener Anthropic API Key

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Sign up
3. Settings → API Keys → Create Key
4. Copia la key (empieza con `sk-ant-api03-...`)

Agregar a `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui
```

### Paso 2: Implementar Analyzer

Seguir [PLAN_DESARROLLO.md - Etapa 3](PLAN_DESARROLLO.md#etapa-3-agente-de-ia---análisis-simple)

Archivos a crear:

1. `src/lib/langchain/analyzer.ts`
2. `src/lib/langchain/analyzer.test.ts`
3. Actualizar `src/app/api/webhooks/github/route.ts`

### Paso 3: Probar

```bash
# Test unitario
npx tsx src/lib/langchain/analyzer.test.ts

# Test con webhook real
# Haz commit en GitHub
# Observa consola:
# 🤖 Análisis IA: { type: 'feature', shouldDocument: true, ... }
```

**✅ Checkpoint**: Si el análisis aparece, ¡perfecto!

---

## 📅 Sesión 4: Generación de Docs (2-3 horas)

Seguir [PLAN_DESARROLLO.md - Etapa 4](PLAN_DESARROLLO.md#etapa-4-generación-de-documentación)

1. Crear `src/lib/langchain/generator.ts`
2. Crear `src/services/documentation/save.ts`
3. Actualizar webhook
4. Probar con commit

**✅ Checkpoint**: Si se genera documentación en Markdown, ¡MVP básico listo! 🎉

---

## 🎯 Después del MVP Básico

Una vez que tengas las Etapas 1-4 funcionando, puedes:

**Opción A: Continuar con Etapa 5** (Queue + Workers)

- Hacer el sistema más robusto
- Procesar en background

**Opción B: Saltar a Etapa 6** (Dashboard)

- Ver tus docs generadas en interfaz bonita
- Más satisfactorio visualmente

**Opción C: Usar el MVP básico**

- Ya funciona end-to-end
- Puedes probar con proyectos reales
- Iterar basado en feedback

---

## 📚 Archivos de Referencia

Mientras desarrollas, ten abiertos:

1. **[PLAN_DESARROLLO.md](PLAN_DESARROLLO.md)** - Guía detallada paso a paso
2. **[PLAN_DESARROLLO_5-9.md](PLAN_DESARROLLO_5-9.md)** - Etapas avanzadas
3. **[CHECKLIST_PROGRESO.md](CHECKLIST_PROGRESO.md)** - Marca tu progreso
4. **[SCRIPTS.md](SCRIPTS.md)** - Comandos útiles

---

## 🆘 Si Te Atascas

### Error: Cannot find module

```bash
pnpm install
pnpm db:generate
```

### Error: Redis connection

```bash
# Instalar Redis con Docker
docker run -d -p 6379:6379 --name docuai-redis redis:alpine
```

### Error: TypeScript

```bash
# Reiniciar TS server
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Error: Variables de entorno no se cargan

```bash
# Reiniciar servidor
# Ctrl+C en pnpm dev
pnpm dev
```

### Error: ngrok command not found

```bash
# Si ngrok está instalado pero no en PATH, usa ruta completa:
C:\Users\HP\ngrok\ngrok.exe http 3000

# O agrega al PATH permanentemente (PowerShell):
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\Users\HP\ngrok", "User")
# Cierra y abre PowerShell
```

### Necesitas ayuda de Claude

Cuando me preguntes, menciona el contexto:

```
"Siguiendo PLAN_DESARROLLO.md Etapa X, tengo este error..."
"Usando el contexto de docuai-context.md, cómo implemento..."
```

Los prompts en `.vscode/prompts/` me dan contexto automático.

---

## 🎯 Objetivos de la Primera Semana

- [ ] Etapa 1: Auth funciona
- [ ] Etapa 2: Webhook recibe commits
- [ ] Etapa 3: IA analiza commits
- [ ] Etapa 4: Docs se generan

Si logras esto → **¡Tienes un MVP funcional!** 🚀

---

## 💡 Tips

1. **Trabaja en sesiones de 2-3 horas**
   - Menos burnout
   - Mejor enfoque

2. **Completa una etapa antes de seguir**
   - No saltes pasos
   - Cada etapa valida la anterior

3. **Prueba constantemente**
   - Cada cambio, prueba
   - No acumules código sin testar

4. **Usa el checklist**
   - `CHECKLIST_PROGRESO.md`
   - Marca lo que completes
   - Sensación de progreso

5. **Commit frecuente**

   ```bash
   git add .
   git commit -m "feat: implement webhook handler"
   git push
   ```

6. **Documenta problemas**
   - En `CHECKLIST_PROGRESO.md` sección "Issues"
   - Te ayudará a recordar soluciones

---

## 🎉 ¡Éxito!

Tienes un proyecto:

- ✅ Bien arquitecturado
- ✅ Con plan claro
- ✅ Validado con investigación real
- ✅ Con potencial comercial real

**Ahora solo falta ejecutar el plan.**

Empieza con Supabase mañana. En 1 semana tendrás un MVP funcional. En 4-6 semanas tendrás un producto completo listo para usuarios reales.

**¡Vamos a construir algo increíble! 🚀**

---

**Próxima sesión**: Crear cuenta Supabase → Configurar .env.local → Push schema → Probar auth

¿Tienes dudas antes de empezar? Pregunta lo que necesites.
