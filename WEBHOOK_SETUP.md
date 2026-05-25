# 🔗 Configuración de Webhooks - DocuAI

## ¿Qué es un Webhook?

Un webhook es una forma de que GitHub notifique a DocuAI cada vez que haces un `push` a tu repositorio. Esto permite que la documentación se genere automáticamente.

---

## Opción 1: Configuración Automática (Recomendado)

Si usas el botón "Conectar Repositorio" y proporcionas la URL del webhook, DocuAI configurará todo automáticamente.

**URL del webhook:**

- **Desarrollo (ngrok):** `https://tu-ngrok-url.ngrok.io/api/webhooks/github`
- **Producción:** `https://tu-dominio.com/api/webhooks/github`

---

## Opción 2: Configuración Manual

Si el webhook no se creó automáticamente, sigue estos pasos:

### 1. Ve a la Configuración del Repositorio

1. Abre tu repositorio en GitHub
2. Ve a **Settings** (Configuración)
3. En el menú lateral, selecciona **Webhooks**
4. Haz clic en **Add webhook**

### 2. Configura el Webhook

Completa el formulario con estos valores:

**Payload URL:**

```
https://tu-ngrok-url.ngrok.io/api/webhooks/github
```

_(En producción usa tu dominio real)_

**Content type:**

```
application/json
```

**Secret:**

```
desarrollo-docuai-2026
```

_(Este es el valor de GITHUB_WEBHOOK_SECRET en tu .env.local)_

**Which events would you like to trigger this webhook?**

- Selecciona: **Just the push event**

**Active:**

- ✅ Marca la casilla "Active"

### 3. Guarda el Webhook

Haz clic en **Add webhook**

GitHub enviará un "ping" de prueba. Si todo está bien, verás un ✅ check verde.

---

## 🧪 Probar el Webhook

### Opción A: Redeliver desde GitHub

1. Ve a Settings → Webhooks
2. Haz clic en tu webhook
3. Ve a la pestaña "Recent Deliveries"
4. Haz clic en cualquier delivery
5. Haz clic en **Redeliver**

### Opción B: Hacer un Commit

```bash
git commit --allow-empty -m "test: webhook test"
git push
```

Verás la documentación generada en tu dashboard de DocuAI en unos segundos.

---

## 🔍 Verificar que Funciona

### En GitHub:

1. Settings → Webhooks → Tu webhook
2. Recent Deliveries → Debe mostrar ✅ 200 OK

### En tu Terminal:

Deberías ver logs como:

```
📦 Webhook received: push
📦 Repo: owner/repo-name
🤖 Analizando commit con IA...
📝 Generando documentación Business...
📝 Generando documentación Technical...
💾 Documentación guardada
```

### En el Dashboard:

Verás el nuevo commit con 2 botones: "Ver Business" y "Ver Technical"

---

## ❌ Solución de Problemas

### Error 401 Unauthorized

- Verifica que el **Secret** coincida con `GITHUB_WEBHOOK_SECRET` en `.env.local`

### Error 404 Not Found

- Verifica que la URL del webhook sea correcta
- Si usas ngrok, asegúrate de que esté corriendo: `ngrok http 3000`

### No se reciben webhooks

- Verifica que el servidor Next.js esté corriendo: `pnpm dev`
- Verifica que ngrok esté activo y la URL sea correcta
- Verifica que el webhook esté marcado como "Active" en GitHub

### Webhook recibido pero sin documentación

- Revisa los logs del servidor
- Verifica que el repositorio esté registrado en la base de datos
- Verifica que `ANTHROPIC_API_KEY` esté configurada en `.env.local`

---

## 📝 Notas Importantes

### En Desarrollo:

- Necesitas **ngrok** corriendo: `ngrok http 3000`
- La URL de ngrok cambia cada vez que reinicias ngrok
- Debes actualizar el webhook en GitHub cada vez que cambies la URL

### En Producción:

- Usa tu dominio real (ej: `https://docuai.com/api/webhooks/github`)
- Asegúrate de que el certificado SSL sea válido
- Configura rate limiting para evitar abusos

---

## 🔐 Seguridad

DocuAI **siempre verifica** la firma HMAC del webhook usando el secret. Esto garantiza que solo GitHub puede enviar webhooks válidos a tu aplicación.

El código de verificación está en: `src/app/api/webhooks/github/route.ts`

---

¿Necesitas ayuda? Revisa los logs del servidor para más detalles sobre errores.
