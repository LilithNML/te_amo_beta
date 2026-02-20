# Lumen — JSON Visual Editor

> Editor visual sin dependencias para crear y gestionar archivos `data.json` compatibles con Lumen Data Core.

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![Version](https://img.shields.io/badge/version-2.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Schema](https://img.shields.io/badge/schema-v2.0-orange) ![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-purple)

---

## Tabla de contenidos

- [Estado](#estado)
- [Requisitos](#requisitos)
- [Instalación (local)](#instalación-local)
- [Ejecución (dev)](#ejecución-dev)
- [Build y preview (producción)](#build-y-preview-producción)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Esquema data.json](#esquema-datajson)
- [Rutas y convenciones de assets](#rutas-y-convenciones-de-assets)
- [APIs / Integración](#apis--integración)
- [Validaciones y reglas](#validaciones-y-reglas)
- [Flujo de trabajo (dev)](#flujo-de-trabajo-dev)
- [Despliegue / CI](#despliegue--ci)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Mantenimiento](#mantenimiento)
- [Ejemplos / Casos de uso](#ejemplos--casos-de-uso)
- [Checklist de aceptación](#checklist-de-aceptación)
- [Contacto / Owner](#contacto--owner)

---

## Estado

| Campo | Valor |
|---|---|
| **Estado** | ✅ Production |
| **Versión actual** | `2.0.0` (2026-02-11) |
| **Versión del esquema** | `2.0` |
| **Mantenimiento activo** | Sí |

Ver historial completo en [`CHANGELOG.md`](./CHANGELOG.md).

---

## Requisitos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Navegador moderno | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | Sin polyfills |
| Node.js | 18.x LTS | Solo para CI/AJV validation |
| npm | 8.x | Solo para CI |
| Servidor HTTP | Cualquier servidor estático | No requiere backend |

> **Nota:** La aplicación es una SPA con cero dependencias externas en runtime. Node/npm solo son necesarios para el pipeline de CI (validación del schema con AJV).

---

## Instalación (local)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/lumen-editor.git
cd lumen-editor

# 2. (Opcional) Instalar dependencias de desarrollo para CI local
npm ci

# 3. Copiar variables de entorno de ejemplo
cp .env.example .env
```

No existe `.env` obligatorio para la UI. El `.env` es relevante únicamente si se integra un pipeline de CI con tokens (ej. Netlify deploy key).

---

## Ejecución (dev)

La aplicación es un archivo HTML único. No requiere bundler ni proceso de compilación.

**Opción A — Servidor HTTP simple con Node:**

```bash
npx serve . -p 3000
# Abrir: http://localhost:3000/Lumen_v2.html
```

**Opción B — Python (sin Node):**

```bash
python3 -m http.server 3000
# Abrir: http://localhost:3000/Lumen_v2.html
```

**Opción C — VS Code Live Server:**

Instalar la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), click derecho en `Lumen_v2.html` → *Open with Live Server*. Hot-reload automático al guardar.

---

## Build y preview (producción)

La aplicación no requiere paso de build. El archivo `Lumen_v2.html` **es** el artefacto de producción.

```bash
# Validar el schema antes de desplegar (requiere npm ci)
npm run validate        # ejecuta AJV sobre examples/data.sample.json

# Preview local de producción
npm run preview         # sirve /public en puerto 4000
```

### Despliegue en plataformas estáticas

**GitHub Pages:**

```bash
# Colocar Lumen_v2.html en la raíz o en /docs
# Habilitar Pages en Settings > Pages > Branch: main / folder: /root
```

**Netlify:**

```bash
# Arrastrar la carpeta del proyecto al dashboard de Netlify
# O conectar el repositorio con configuración:
# Build command: (vacío)
# Publish directory: .
```

**Vercel:**

```bash
npx vercel --prod
# Framework preset: Other
# Output directory: .
```

> El archivo `data.json` y la carpeta `assets/` deben estar en la misma raíz que `Lumen_v2.html` en el servidor de producción.

---

## Estructura del repositorio

```
/ (repo)
├── README.md                    # Esta documentación
├── CHANGELOG.md                 # Historial de versiones (SemVer)
├── Lumen_v2.html                # SPA principal — artefacto de producción
├── data.json                    # Datos de contenido (generado por el editor)
├── .env.example                 # Variables de entorno de ejemplo para CI
├── package.json                 # Scripts de CI y dependencias dev (AJV)
│
├── examples/
│   └── data.sample.json         # Ejemplo con 1 ítem por cada type
│
├── schema/
│   └── data.schema.json         # JSON Schema v2019-09 del contrato data.json
│
├── assets/
│   └── unlocked_content/
│       ├── images/              # Recursos gráficos (.jpg, .png, .webp, .gif)
│       ├── audio/               # Recursos sonoros (.mp3, .ogg, .wav, .flac, .m4a)
│       └── encrypted/           # Archivos protegidos (.wenc, .zip)
│
└── .github/
    └── workflows/
        └── ci.yml               # Pipeline de validación (AJV + deploy)
```

---

## Esquema data.json

### Versión del esquema: `2.0`

El archivo `data.json` es el contrato entre el editor y cualquier aplicación consumidora (visualizador, juego de pistas, plataforma educativa). Sigue esta estructura raíz:

```json
{
  "schemaVersion": "2.0",
  "mensajes": { ... },
  "logros": [ ... ]
}
```

### Colección `mensajes`

Objeto donde cada **clave** es el código de desbloqueo normalizado (slug) y el **valor** es un objeto de configuración del contenido.

| Propiedad | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `string` | ✅ | Tipo de contenido. Ver tipos válidos abajo. |
| `categoria` | `string` | ✅ | Asignada automáticamente por el editor según el `type`. |
| `pista` | `string` | ✅ | Texto visible al usuario antes de desbloquear el ítem. |
| `texto` | `string` | Condicional | Contenido narrativo. Saltos de línea como `\n` literal. |
| `videoEmbed` | `string` | Condicional | URL de embed de YouTube (`https://www.youtube.com/embed/{ID}`). |
| `imagen` | `string` | Condicional | Ruta relativa al recurso gráfico. |
| `audio` | `string` | Condicional | Ruta relativa al recurso sonoro. |
| `descarga` | `object` | Condicional | Objeto `{ "url": "...", "nombre": "..." }` para archivos protegidos. |
| `link` | `string` | Condicional | URL externa completa con protocolo `http://` o `https://`. |
| `archivo` | `string` | Condicional | Ruta de archivo interno para renderizado en iframe. |

**Tipos válidos (`type`):**

| Valor | Categoría auto | Campos dinámicos requeridos |
|---|---|---|
| `text` | `Carta` | `texto` |
| `video` | `YouTube` | `videoEmbed` (+ `texto` opcional) |
| `image` | `Imagen` | `imagen` |
| `audio` | `Audio` | `audio` |
| `image_audio` | `Audio e Imagen` | `imagen`, `audio` |
| `download` | `Protegido` | `descarga.nombre` |
| `link` | `Url` | `link` |
| `internal` | `Iframe` | `archivo` |

### Colección `logros`

Array de objetos que define hitos basados en la progresión del usuario.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador único del logro (slug normalizado). |
| `codigo_requerido` | `number` | Cantidad de códigos desbloqueados para activar el hito. |
| `mensaje` | `string` | Notificación/felicitación que recibe el usuario al alcanzar el hito. |

### Ejemplo completo mínimo

```json
{
  "schemaVersion": "2.0",
  "mensajes": {
    "sanvalentin": {
      "type": "text",
      "categoria": "Carta",
      "pista": "El día del amor y la amistad.",
      "texto": "Feliz día.\nCon todo mi cariño."
    },
    "batman": {
      "type": "image_audio",
      "categoria": "Audio e Imagen",
      "pista": "El señor de la noche.",
      "imagen": "assets/unlocked_content/images/batman.jpeg",
      "audio": "assets/unlocked_content/audio/batman.ogg"
    }
  },
  "logros": [
    {
      "id": "primer_paso",
      "codigo_requerido": 1,
      "mensaje": "¡Primer código desbloqueado!"
    }
  ]
}
```

> Ver ejemplo completo con todos los tipos en [`examples/data.sample.json`](./examples/data.sample.json).
> Ver contrato formal en [`schema/data.schema.json`](./schema/data.schema.json).

---

## Rutas y convenciones de assets

### Estructura de directorios esperada

```
root/
├── data.json
├── Lumen_v2.html
└── assets/
    └── unlocked_content/
        ├── images/        ← imágenes
        ├── audio/         ← audio
        └── encrypted/     ← archivos protegidos
```

### Prefijos de ruta (configurables en `PATHS`)

```js
// src: Lumen_v2.html — objeto PATHS
const PATHS = {
    image:     "assets/unlocked_content/images/",
    audio:     "assets/unlocked_content/audio/",
    encrypted: "assets/unlocked_content/encrypted/"
};
```

### Formatos permitidos

| Tipo de asset | Extensiones válidas | Límite recomendado |
|---|---|---|
| Imagen | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | < 2 MB |
| Audio | `.mp3`, `.ogg`, `.wav`, `.flac`, `.m4a` | < 10 MB |
| Archivos protegidos | `.wenc`, `.zip` | Sin límite (según servidor) |

> El editor solo necesita el **nombre del archivo** (ej. `foto.jpg`). La ruta de carpeta se añade automáticamente al guardar.

---

## APIs / Integración

### Import (FileReader API)

La importación de `data.json` es 100% client-side, sin servidor.

```js
// Flujo interno del editor al cargar un archivo
const reader = new FileReader();
reader.onload = (event) => {
    const json = JSON.parse(event.target.result);
    // Validación de estructura básica
    if (!json.mensajes && !json.logros) {
        throw new Error("Estructura JSON no reconocida");
    }
    // Cada mensaje pasa por validateMessage() antes de importarse
    for (const [id, msg] of Object.entries(json.mensajes)) {
        const errors = validateMessage(msg.type, msg);
        if (errors.length === 0) validMensajes.set(id, msg);
        else importErrors.push(`ID "${id}": ${errors.join(', ')}`);
    }
};
reader.readAsText(file);
```

- Los ítems con errores de validación se reportan en un modal de errores de importación.
- Los ítems válidos se cargan aunque haya ítems inválidos.

### Export (Blob API)

La exportación genera un archivo `data.json` minificado descargable:

```js
// Flujo interno al descargar
const exportData = {
    mensajes: Object.fromEntries(appState.mensajes),
    logros: appState.logros
};
const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Se crea un <a> temporal para disparar la descarga
```

- La exportación se bloquea si existen modales abiertos o IDs duplicados pendientes.
- Los saltos de línea en el campo `texto` se exportan como `\n` literales.

### Persistencia de sesión (LocalStorage)

```js
// Guardado automático en cada cambio
localStorage.setItem('lumenState', JSON.stringify({
    mensajes: Object.fromEntries(appState.mensajes),
    logros: appState.logros
}));
```

- Clave: `lumenState`
- Se carga automáticamente al iniciar si existe sesión previa.
- **Ningún dato se envía a servidores externos.**

---

## Validaciones y reglas

### Normalización de IDs

Todos los IDs (claves de `mensajes` y `id` de `logros`) pasan por `normalizeId` antes de guardarse:

```js
const normalizeId = (str) => {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // Eliminar acentos
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');        // Solo alfanumérico
};
```

**Ejemplos:**

| Entrada | ID normalizado |
|---|---|
| `"San Valentín"` | `"sanvalentin"` |
| `"Café & Co."` | `"cafeco"` |
| `"12 Abril 1989"` | `"12abril1989"` |
| `""` | `""` ❌ (inválido) |

### Extracción de ID de YouTube

```js
const extractYouTubeID = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};
```

**URLs soportadas:**

| Formato | Ejemplo |
|---|---|
| Estándar | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| Acortada | `https://youtu.be/dQw4w9WgXcQ` |
| Embed | `https://www.youtube.com/embed/dQw4w9WgXcQ` |
| Shorts | `https://www.youtube.com/shorts/dQw4w9WgXcQ` |

**Error esperado si el ID no es válido (11 caracteres):**
```
"Enlace de YouTube no válido."
```

### Reglas por tipo

| Tipo | Regla | Mensaje de error |
|---|---|---|
| `text` | `texto` no vacío | `"El texto es obligatorio para tipo 'Texto'"` |
| `video` | URL con ID YouTube válido | `"Enlace de YouTube no válido"` |
| `image` | Extensión en `[jpg, jpeg, png, webp, gif]` | `"Extensión de imagen inválida. Use: jpg, jpeg, png, webp, gif"` |
| `audio` | Extensión en `[mp3, ogg, wav, flac, m4a]` | `"Extensión de audio inválida. Use: mp3, ogg, wav, flac, m4a"` |
| `image_audio` | Ambas reglas de imagen y audio | Ambos mensajes según campo |
| `download` | `descarga.nombre` no vacío | `"El nombre de archivo para descarga es obligatorio"` |
| `link` | URL con protocolo `http://` o `https://` | `"La URL debe comenzar con http:// o https://"` |
| `internal` | `archivo` no vacío | `"La ruta del archivo interno es obligatoria"` |
| Todos | `pista` no vacía | `"La pista es obligatoria"` |
| Todos | ID único (no duplicado) | `"Ya existe un recuerdo con ese nombre (ID duplicado)."` |

---

## Flujo de trabajo (dev)

### Branch strategy

```
main          ← producción estable (tagged releases)
  └── develop ← integración continua
        └── feature/xxx  ← nuevas funcionalidades
        └── fix/xxx      ← correcciones
        └── docs/xxx     ← documentación
```

### Commits (Conventional Commits)

```bash
feat: añadir soporte para tipo 'podcast'
fix: corregir extracción de ID de YouTube Shorts
docs: actualizar README con sección de assets
chore: actualizar AJV a v8
```

### Scripts disponibles

```bash
npm run validate     # Valida examples/data.sample.json contra schema/data.schema.json
npm run lint         # Linter HTML/JS (si configurado)
npm run test         # Ejecuta suite de tests
npm run preview      # Servidor estático local en :4000
```

### Versionado (SemVer)

- **PATCH** `x.x.Z`: Corrección de bugs, sin cambios en el esquema.
- **MINOR** `x.Y.0`: Nueva funcionalidad retrocompatible.
- **MAJOR** `X.0.0`: Cambios incompatibles en el esquema o la API.

Cada release requiere:
1. Actualizar `CHANGELOG.md` con la nueva entrada.
2. Tag git: `git tag -a v2.0.0 -m "Release v2.0.0"`
3. Push del tag: `git push origin v2.0.0`

---

## Despliegue / CI

### Pipeline de GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI — Validate & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate schema
        run: npm run validate
        # Valida examples/data.sample.json contra schema/data.schema.json con AJV

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

### Health checks post-deploy

- Verificar que `Lumen_v2.html` carga con status 200.
- Abrir la UI y hacer clic en "Cargar JSON" con `examples/data.sample.json` — debe importar sin errores.
- Verificar que la búsqueda con `Ctrl+K` responde correctamente.

### Rollback

```bash
# Identificar el tag anterior estable
git tag -l | sort -V | tail -5

# Revertir a una versión anterior
git checkout v1.0.0
git push origin HEAD:main --force  # con cuidado en producción

# O revertir via GitHub Pages: redeploy del tag anterior desde Actions
```

---

## Seguridad y privacidad

### Modelo de amenazas

| Amenaza | Mitigación |
|---|---|
| Exfiltración de datos | **Sin backend.** Todo procesamiento es client-side. Ningún dato sale del navegador. |
| XSS en campos de texto | El editor no renderiza HTML del usuario. Los campos se manejan como texto plano. |
| Sobrescritura accidental de IDs | Sistema de bloqueo de IDs duplicados antes de guardar. |
| Pérdida de datos por cierre del navegador | Auto-guardado en LocalStorage en cada cambio. |
| Importación de JSON malicioso | Validación estricta de estructura y tipos antes de importar. Ítems inválidos se rechazan con reporte de errores. |

### Archivos `.wenc` (contenido cifrado)

- Los archivos `.wenc` son el formato de contenido protegido de Lumen.
- El editor **solo gestiona las rutas** de estos archivos; no los lee, descifra ni procesa.
- El cifrado/descifrado es responsabilidad de la aplicación visualizadora (Lumen Data Core).
- **Nunca subir claves de descifrado al repositorio.** Usar variables de entorno o almacenamiento seguro externo.

### Recomendaciones de despliegue

```
# Headers recomendados para el servidor de producción
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

> Servir siempre sobre **HTTPS** en producción. Los archivos de assets pueden contener contenido sensible.

---

## Mantenimiento

### Versionado del esquema

El esquema de `data.json` usa versionado independiente del editor. Al cambiar el esquema:

1. Actualizar `schemaVersion` en `schema/data.schema.json`.
2. Actualizar la constante `SCHEMA_VERSION` en `Lumen_v2.html` (si existe).
3. Documentar el cambio en `CHANGELOG.md`.
4. Proveer script de migración si el cambio es incompatible (MAJOR).

### Añadir un nuevo `type`

Para añadir un tipo de contenido nuevo (ej. `podcast`), modificar en este orden:

**1. `Lumen_v2.html` — objeto `CATEGORIES`:**

```js
const CATEGORIES = {
    // ... tipos existentes ...
    podcast: "Podcast"  // ← Añadir aquí
};
```

**2. `Lumen_v2.html` — objeto `PATHS` (si requiere nueva carpeta):**

```js
const PATHS = {
    // ... rutas existentes ...
    podcast: "assets/unlocked_content/podcast/"  // ← Añadir si aplica
};
```

**3. `Lumen_v2.html` — función `getFieldsForType`:**

```js
case 'podcast':
    fields.push('audio', 'texto');  // Campos dinámicos del nuevo tipo
    break;
```

**4. `Lumen_v2.html` — función `validateMessage`:**

```js
case 'podcast':
    if (!data.audio) errors.push("El archivo de audio es obligatorio");
    break;
```

**5. `Lumen_v2.html` — HTML del formulario:** Añadir los campos dinámicos con `data-for="podcast"`.

**6. `schema/data.schema.json`:** Añadir `"podcast"` al enum de `type`.

**7. `examples/data.sample.json`:** Añadir un ejemplo del nuevo tipo.

### Cambiar rutas de assets

Modificar el objeto `PATHS` en `Lumen_v2.html` y actualizar `schema/data.schema.json` con los nuevos patrones de ruta.

### Cambiar estilos globales

El sistema de diseño usa CSS Custom Properties en `:root`:

```css
:root {
    --primary-color: #4a6fa5;
    --danger-color: #e63946;
    --success-color: #2a9d8f;
    --radius: 8px;
    /* ... */
}
```

Modificar estas variables para cambios globales de marca sin tocar el resto del CSS.

---

## Ejemplos / Casos de uso

Ver el archivo completo en [`examples/data.sample.json`](./examples/data.sample.json).

### Caso 1 — Texto (carta o mensaje)

```json
"noviembre9": {
    "type": "text",
    "categoria": "Carta",
    "pista": "El destino nos unió el día 9, en noviembre.",
    "texto": "Mi amor:\n\nGracias por aparecer en mi mundo.\n\nCon cariño."
}
```

> Los saltos de línea se escriben como `\n` literal en el JSON. El visualizador los interpreta.

### Caso 2 — Imagen + Audio simultáneos

```json
"batman": {
    "type": "image_audio",
    "categoria": "Audio e Imagen",
    "pista": "El señor de la noche.",
    "imagen": "assets/unlocked_content/images/batman.jpeg",
    "audio": "assets/unlocked_content/audio/batman.ogg"
}
```

### Caso 3 — Video de YouTube

```json
"recuerdo_especial": {
    "type": "video",
    "categoria": "YouTube",
    "pista": "El video que me enviaste aquel día.",
    "videoEmbed": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "texto": "Este video lo guardo con mucho cariño."
}
```

> `videoEmbed` siempre usa el formato `https://www.youtube.com/embed/{ID}`. El editor lo genera automáticamente desde cualquier URL de YouTube.

### Caso 4 — Descarga protegida (`.wenc`)

```json
"2008": {
    "type": "download",
    "categoria": "Fotos",
    "pista": "El año en que todo empezó.",
    "descarga": {
        "url": "assets/unlocked_content/encrypted/foto-secreta.jpg.wenc",
        "nombre": "foto-secreta.jpg.wenc"
    }
}
```

> El editor solo necesita el nombre del archivo. La URL completa se construye automáticamente.

### Caso 5 — Link externo

```json
"playlist": {
    "type": "link",
    "categoria": "Url",
    "pista": "La playlist que hice pensando en ti.",
    "link": "https://open.spotify.com/playlist/xxxxx"
}
```

> El protocolo `https://` es obligatorio. URLs sin protocolo son rechazadas.

### Configuración de logros

```json
"logros": [
    {
        "id": "primer_paso",
        "codigo_requerido": 1,
        "mensaje": "¡Primer código desbloqueado! Hay muchos más esperándote."
    },
    {
        "id": "explorador",
        "codigo_requerido": 10,
        "mensaje": "¡10 secretos revelados! Tu curiosidad no tiene límites."
    },
    {
        "id": "coleccionista",
        "codigo_requerido": 50,
        "mensaje": "¡50 recuerdos! Eres increíble."
    }
]
```

> Los logros se ordenan automáticamente por `codigo_requerido` en la vista del editor.

---

## Checklist de aceptación

Para considerar un PR completo y listo para merge:

- [ ] `README.md` cubre todas las secciones obligatorias y tiene TOC funcional.
- [ ] `examples/data.sample.json` contiene al menos 1 ejemplo por cada `type` (`text`, `video`, `image`, `audio`, `image_audio`, `download`, `link`, `internal`).
- [ ] `examples/data.sample.json` carga correctamente en `Lumen_v2.html` sin errores de validación.
- [ ] `schema/data.schema.json` valida exitosamente `examples/data.sample.json` con AJV (`npm run validate` en verde).
- [ ] Las instrucciones de build y run funcionan en una máquina limpia (verificado por reviewer).
- [ ] Las reglas críticas de validación (IDs, YouTube ID, extensiones de archivo) están documentadas con fragmentos de código y ejemplos de error.
- [ ] `CHANGELOG.md` incluye la entrada correspondiente con referencia al PR y ticket.
- [ ] El PR usa el label `docs` y tiene un commit lógico por cambio.
- [ ] Los headers HTTP recomendados para producción están documentados.
- [ ] El pipeline de CI (`.github/workflows/ci.yml`) ejecuta la validación del schema automáticamente.

---

## Contacto / Owner

| Rol | Contacto |
|---|---|
| **Owner del repositorio** | Lumen Core Team |
| **Canal de soporte** | Issues de GitHub → [Abrir issue](https://github.com/tu-org/lumen-editor/issues) |
| **Reportar bug de seguridad** | Directamente por email (no abrir issue público) |
| **Documentación generada** | 2026 — Lumen Core Team |

---

*Documentación v2.0 — Lumen Core Team — 2026*
