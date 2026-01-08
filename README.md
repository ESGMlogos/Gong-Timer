# Gong Timer - Zen Meditation App

Una aplicación de temporizador secuencial con sonidos procedurales (Gongs, Cuencos Tibetanos, Mantras) y rutinas generadas por Inteligencia Artificial.

---

## 📱 ¿Cómo instalar y usar esta App? (Guía para No-Programadores)

Esta aplicación está construida con tecnología web moderna (**React**). Existen dos formas principales de usarla en tu celular:

1.  **Como PWA (Recomendado):** La forma más moderna ("WAV/WAF"). No necesitas descargar nada de una tienda. Se instala directamente desde el navegador y funciona como una App nativa.
2.  **Como APK (Android):** Generando un archivo instalable.

---

### Paso 1: Poner la App en Internet (Despliegue Gratuito)

Para que la app funcione en tu celular, primero debe "vivir" en internet. Usaremos **Vercel** o **Netlify** (son gratuitos y fáciles).

**Requisitos previos:**
*   Una cuenta en [GitHub](https://github.com) (Gratis).
*   Una **API KEY** de Google Gemini (Gratis). Consíguela aquí: [aistudio.google.com](https://aistudio.google.com/app/apikey).

**Instrucciones:**

1.  **Sube este código a GitHub:**
    *   Crea un nuevo repositorio en GitHub.
    *   Sube todos los archivos de este proyecto.

2.  **Conecta con Vercel:**
    *   Ve a [vercel.com](https://vercel.com) y regístrate con tu cuenta de GitHub.
    *   Haz clic en "Add New Project".
    *   Selecciona el repositorio que acabas de crear.

3.  **Configura la Inteligencia Artificial:**
    *   Antes de darle a "Deploy", busca la sección **Environment Variables**.
    *   Nombre (Key): `API_KEY`
    *   Valor (Value): *Pega aquí tu clave de Google Gemini que obtuviste en el paso de requisitos*.
    *   Haz clic en "Add".

4.  **Publicar:**
    *   Haz clic en **Deploy**.
    *   Espera unos segundos. Vercel te dará un enlace (ejemplo: `gong-timer.vercel.app`).

---

### Paso 2: Instalar en tu Celular (Método PWA - Fácil)

Esta es la opción "WAF/WAV" (Progressive Web App). Es la mejor opción para iOS y Android porque no requiere tiendas ni aprobaciones.

#### 🤖 En Android (Chrome)
1.  Abre el enlace que te dio Vercel en **Google Chrome**.
2.  Toca los tres puntos verticales (menú) en la esquina superior derecha.
3.  Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4.  ¡Listo! Ahora tendrás el icono del Gong Timer en tu menú de apps y se abrirá a pantalla completa sin barras de navegador.

#### 🍎 En iOS (iPhone/iPad - Safari)
1.  Abre el enlace que te dio Vercel en **Safari**.
2.  Toca el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3.  Baja y selecciona **"Agregar al inicio"** (Add to Home Screen).
4.  Toca "Agregar".
5.  ¡Listo! La app aparecerá en tu pantalla de inicio y funcionará como una app nativa.

---

### Paso 3: Generar un APK (Solo Android - Opcional)

Si prefieres tener un archivo `.apk` real para compartir por WhatsApp o instalar manualmente en Android:

*Nota: Para iOS no se puede generar un archivo instalable fácilmente sin una Mac y pagar la licencia de desarrollador de Apple ($99/año). Por eso el método PWA (Paso 2) es el estándar hoy en día.*

**Cómo crear el APK gratis:**

1.  Toma el enlace de tu app ya publicada (el de Vercel del Paso 1).
2.  Ve a un servicio gratuito de conversión como **WebIntoApp** o **AppsGeyser**.
3.  Pega tu enlace (URL).
4.  Sube el icono (puedes usar el que está en `manifest.json` o uno propio).
5.  Dale a "Next" y descarga tu archivo **APK**.
6.  Envía ese archivo a tu celular e instálalo. (Tendrás que activar "Instalar de fuentes desconocidas").

---

## 🛠️ Para Desarrolladores (Cómo correrlo en tu PC)

Si quieres modificar el código:

1.  Instala [Node.js](https://nodejs.org/).
2.  Abre la terminal en la carpeta del proyecto.
3.  Instala las dependencias (aunque este proyecto usa importaciones directas ESM, si usaras un bundler):
    ```bash
    npm install
    ```
4.  Crea un archivo `.env` en la raíz y agrega tu llave:
    ```
    API_KEY=tu_clave_de_gemini_aqui
    ```
5.  Corre el servidor local (si usas Vite/Parcel):
    ```bash
    npm run dev
    ```

## 🎨 Características

*   **Sonido Procedural:** Los sonidos no son grabaciones MP3, se generan matemáticamente en tiempo real usando la Web Audio API.
*   **Diseño Zen:** Estilo minimalista inspirado en piedra y mármol.
*   **IA Integrada:** Genera rutinas de meditación personalizadas usando Google Gemini.
*   **Offline Ready:** Gracias a la tecnología PWA.
