# 🔐 Configuración de OAuth para DocuAI

## ✅ ¿Qué ya está hecho?

- ✅ Código OAuth implementado en el login
- ✅ Botones de Google y GitHub funcionando
- ✅ Callback handler configurado

## 📋 Lo que TÚ debes hacer (15-20 minutos)

---

## 🔵 Paso 1: Configurar Google OAuth

### 1.1. Crear Proyecto en Google Cloud

1. Ve a: https://console.cloud.google.com
2. Click en **Select a project** (arriba izquierda)
3. Click en **NEW PROJECT**
4. Nombre del proyecto: `DocuAI`
5. Click **CREATE**

### 1.2. Habilitar Google+ API

1. En el menú lateral → **APIs & Services** → **Library**
2. Busca: `Google+ API`
3. Click en **Google+ API**
4. Click **ENABLE**

### 1.3. Configurar Pantalla de Consentimiento

1. En el menú lateral → **APIs & Services** → **OAuth consent screen**
2. Selecciona: **External**
3. Click **CREATE**

**Información de la app:**

```
App name: DocuAI
User support email: tu@email.com
Developer contact email: tu@email.com
```

4. Click **SAVE AND CONTINUE**
5. **Scopes** → Click **SAVE AND CONTINUE** (sin agregar ninguno)
6. **Test users** → Click **SAVE AND CONTINUE** (opcional)
7. Click **BACK TO DASHBOARD**

### 1.4. Crear Credenciales OAuth

1. En el menú lateral → **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `DocuAI Web Client`

**Authorized JavaScript origins:**

```
http://localhost:3000
```

**Authorized redirect URIs:**

```
http://localhost:3000/auth/callback
https://voaecvbmmtcniqhahfyd.supabase.co/auth/v1/callback
```

5. Click **CREATE**

### 1.5. Copiar Credenciales

Aparecerá un modal con:

- ✅ **Client ID**: `123456789-abc.apps.googleusercontent.com`
- ✅ **Client Secret**: `GOCSPX-abc123...`

**¡NO CIERRES ESTA VENTANA!** Las necesitarás en el siguiente paso.

---

## ⚫ Paso 2: Configurar GitHub OAuth

### 2.1. Crear OAuth App en GitHub

1. Ve a: https://github.com/settings/developers
2. Click en **OAuth Apps** (menú lateral)
3. Click **New OAuth App**

**Información de la app:**

```
Application name: DocuAI
Homepage URL: http://localhost:3000
Authorization callback URL: https://voaecvbmmtcniqhahfyd.supabase.co/auth/v1/callback
```

4. Click **Register application**

### 2.2. Generar Client Secret

1. En la página de la app, click **Generate a new client secret**
2. Confirma tu contraseña de GitHub

### 2.3. Copiar Credenciales

- ✅ **Client ID**: `Ov23li...` (visible en la página)
- ✅ **Client Secret**: `abc123...` (acabas de generar)

**¡COPIA EL SECRET AHORA!** Solo se muestra una vez.

---

## 🔧 Paso 3: Configurar Supabase

### 3.1. Ir a Configuración de Auth

1. Ve a: https://supabase.com/dashboard/project/voaecvbmmtcniqhahfyd
2. En el menú lateral → **Authentication** → **Sign In / Providers**

### 3.2. Configurar Google

1. Busca **Google** en la lista
2. Click para expandir
3. **Enable Sign in with Google**: ✅ ON

**Pega las credenciales de Google:**

```
Client ID (for OAuth): [PEGA EL CLIENT ID DE GOOGLE]
Client Secret (for OAuth): [PEGA EL CLIENT SECRET DE GOOGLE]
```

4. Click **Save**

### 3.3. Configurar GitHub

1. Busca **GitHub** en la lista
2. Click para expandir
3. **Enable Sign in with GitHub**: ✅ ON

**Pega las credenciales de GitHub:**

```
Client ID (for OAuth): [PEGA EL CLIENT ID DE GITHUB]
Client Secret (for OAuth): [PEGA EL CLIENT SECRET DE GITHUB]
```

4. Click **Save**

---

## 🧪 Paso 4: Probar OAuth

### 4.1. Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
pnpm dev
```

### 4.2. Ir al Login

1. Abre: http://localhost:3000/login
2. Deberías ver:
   - 🔵 **Continuar con Google**
   - ⚫ **Continuar con GitHub**
   - Divider
   - Email input (magic link)

### 4.3. Probar Google OAuth

1. Click en **Continuar con Google**
2. Selecciona tu cuenta de Google
3. Acepta permisos
4. ✅ Deberías ser redirigido al dashboard

### 4.4. Probar GitHub OAuth

1. **Cierra sesión** (botón en el dashboard)
2. Vuelve a: http://localhost:3000/login
3. Click en **Continuar con GitHub**
4. Autoriza la app
5. ✅ Deberías ser redirigido al dashboard

---

## ❌ Solución de Problemas

### Error: "Redirect URI mismatch"

**Causa**: Las URLs en Google/GitHub no coinciden con Supabase

**Solución**:

1. Verifica que en Google Cloud y GitHub tengas:
   ```
   https://voaecvbmmtcniqhahfyd.supabase.co/auth/v1/callback
   ```
2. Espera 5 minutos para que se propague el cambio
3. Intenta de nuevo

### Error: "Invalid client"

**Causa**: Client ID o Secret incorrectos en Supabase

**Solución**:

1. Ve a Supabase → Authentication → Providers
2. Verifica que copiaste correctamente:
   - Client ID completo
   - Client Secret completo (sin espacios extra)
3. Guarda cambios
4. Intenta de nuevo

### Error: "Access denied"

**Causa**: No autorizaste la app en Google/GitHub

**Solución**:

1. Intenta de nuevo
2. Cuando aparezca la pantalla de permisos, click en **Allow** o **Authorize**

---

## 🎉 ¡Listo!

Una vez configurado, tus usuarios podrán:

- ✅ Login con Google (1 click, sin contraseña)
- ✅ Login con GitHub (1 click, sin contraseña)
- ✅ Login con Email (magic link, como respaldo)

**La sesión durará 7 días por defecto.**

---

## 📝 Checklist Final

- [ ] Google OAuth configurado en Google Cloud
- [ ] Google OAuth configurado en Supabase
- [ ] GitHub OAuth configurado en GitHub Settings
- [ ] GitHub OAuth configurado en Supabase
- [ ] Probado login con Google
- [ ] Probado login con GitHub
- [ ] Servidor reiniciado

---

## 🚀 Para Producción (cuando despliegues)

Cuando despliegues a Vercel/VPS, actualiza las URLs:

**Google Cloud:**

```
Authorized JavaScript origins:
- https://docuai.tudominio.com

Authorized redirect URIs:
- https://docuai.tudominio.com/auth/callback
- https://voaecvbmmtcniqhahfyd.supabase.co/auth/v1/callback
```

**GitHub:**

```
Homepage URL: https://docuai.tudominio.com
Authorization callback URL: https://voaecvbmmtcniqhahfyd.supabase.co/auth/v1/callback
```

---

**¿Necesitas ayuda?** Avísame si algún paso no funciona. 🔥
