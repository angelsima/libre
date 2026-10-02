# Rato · puesta en marcha

Rato es una web que se instala en el móvil como una app (PWA). El backend ya está creado en tu Supabase (proyecto **libre-app**), y esta carpeta es la interfaz. Para que funcione de verdad faltan cuatro pasos, unos 20–30 minutos en total.

## 0. Probarla antes de nada (modo demo)

Tras subirla (paso 1), abre `https://TU-DIRECCION/?demo=1`. Verás la app con amigos ficticios y podrás tocarlo todo; no se guarda nada. Con `?demo=out` empieza en la pantalla de bienvenida.

## 1. Subir la carpeta a internet (gratis)

La forma más rápida es **Netlify Drop**:

1. Entra en https://app.netlify.com/drop (puedes registrarte con Google).
2. Arrastra **la carpeta `rato` entera** a la página.
3. En unos segundos te da una dirección del tipo `https://nombre-raro-123.netlify.app`. En *Site configuration → Change site name* puedes ponerle un nombre mejor, por ejemplo `rato-malaga.netlify.app`.

Cloudflare Pages o Vercel sirven igual. Para actualizar la app, vuelve a arrastrar la carpeta en la sección *Deploys* del sitio.

## 2. Decirle a Supabase cuál es tu dirección

En https://supabase.com/dashboard → proyecto **libre-app** → **Authentication → URL Configuration**:

- **Site URL:** tu dirección, por ejemplo `https://rato-malaga.netlify.app`
- **Redirect URLs:** añade `https://rato-malaga.netlify.app/**`

Sin esto, los enlaces del correo y el acceso con Google te devolverán a una página que no existe.

## 3. Acceso con email (código de 6 dígitos)

Por defecto, Supabase solo manda un enlace mágico. El código funciona mejor en el móvil, sobre todo con la app instalada, porque el enlace a veces se abre en otro navegador.

En **Authentication → Emails → Templates**, edita las plantillas **Magic Link** y **Confirm signup** y añade esta línea en ambas:

```html
<p>Tu código para entrar en Rato: <strong>{{ .Token }}</strong></p>
```

Puedes dejar también el enlace: la app acepta las dos cosas.

**Importante:** el envío de correo que trae Supabase de serie tiene un límite muy bajo (unos pocos correos por hora) y está pensado solo para pruebas. Para usarla con tus amigos configura un SMTP propio en **Authentication → Emails → SMTP Settings**. Resend (https://resend.com) tiene plan gratuito y se configura en unos minutos, aunque necesitarás un dominio propio para enviar desde él.

## 4. Acceso con Google

1. Entra en https://console.cloud.google.com, crea un proyecto (por ejemplo "Rato") y configura la **pantalla de consentimiento OAuth**: tipo *Externo*, nombre de la app y tu email.
2. Ve a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo **Aplicación web**.
3. En **URI de redireccionamiento autorizados**, pon exactamente:
   `https://vjcdweiojvjwhtezabjn.supabase.co/auth/v1/callback`
4. Copia el **ID de cliente** y el **secreto**.
5. En Supabase: **Authentication → Sign In / Providers → Google** → actívalo y pega los dos valores.

Mientras la pantalla de consentimiento esté en modo *Prueba*, solo podrán entrar con Google las cuentas que añadas como usuarios de prueba. Cuando quieras abrirla a todo el mundo, pulsa *Publicar app*.

## Instalarla en el móvil

- **iPhone (Safari):** botón Compartir → *Añadir a pantalla de inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar app*.

## Cómo funciona por dentro

- **Archivos:** `index.html`, `styles.css`, `app.js` (la app), `demo.js` (modo demo), `sw.js` y `manifest.webmanifest` (para instalarla), e iconos.
- **Conexión con Supabase:** está al principio de `app.js` (`CONFIG`). La clave que aparece es la *publishable*, que es pública por diseño. La seguridad la ponen las reglas de la base de datos, no la clave.
- **`supabase/schema.sql`:** el backend completo. Si algún día quieres empezar de cero en otro proyecto, pégalo en el *SQL Editor* de Supabase y cambia `CONFIG` en `app.js`.

### Privacidad (lo que garantiza la base de datos, no la interfaz)

- Nadie puede leer los ratos de otra persona directamente. Solo se ven a través de una función que aplica la audiencia elegida: todos, cercanos, un grupo, excepciones y "no mostrarme a X".
- El WhatsApp de alguien solo se envía a quien puede verle libre en ese momento.
- Quien ha sido ocultado no tiene forma de saberlo.
- *Borrar mi cuenta* elimina perfil, ratos y conexiones.

## Cambiar el nombre "Rato"

Busca "Rato" en `index.html`, `manifest.webmanifest` y `app.js` (textos de la interfaz y del mensaje de WhatsApp) y sustitúyelo.

## Límites conocidos de esta versión

- **Sin notificaciones push:** hay que abrir la app para ver quién está libre. La lista se actualiza sola cada 45 segundos y al volver a la app.
- **Salir de un grupo** no borra los contactos que se crearon al entrar en él. Se pueden quitar a mano.
- **Grupos:** máximo 100 personas por grupo y 30 grupos por persona.
- **Ratos:** hasta 8 días de antelación y máximo 30 horas cada uno.
