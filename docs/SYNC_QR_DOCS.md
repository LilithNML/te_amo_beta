# Documentación: Sistema de Sincronización por QR

**Versión:** 1.0  
**Fecha:** 2026-02-20  
**Archivos afectados:** `index.html`, `gameEngine.js`, `uiManager.js`, `style.css`

---

## Índice

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Arquitectura de datos](#2-arquitectura-de-datos)
3. [Flujo completo: Exportación → Importación](#3-flujo-completo)
4. [Referencia de API interna](#4-referencia-de-api-interna)
5. [Guía de pruebas (QA)](#5-guía-de-pruebas-qa)
6. [Limitaciones conocidas y workarounds](#6-limitaciones-conocidas)

---

## 1. Resumen del sistema

La app está alojada en GitHub Pages (sin backend), por lo que no existe una base de datos central para sincronizar progreso entre dispositivos. Esta funcionalidad permite transferir el estado completo del usuario codificándolo en una URL que se muestra como un código QR escaneable.

### Tecnologías utilizadas

| Librería | Versión | CDN | Propósito |
|---|---|---|---|
| LZ-String | 1.5.0 | cdnjs | Comprimir JSON → string URL-safe |
| qrserver API | — | `api.qrserver.com` | Renderizar el QR como imagen PNG |

### Estrategia de compresión

El JSON bruto de progreso puede superar fácilmente los 2 000 caracteres que los navegadores soportan en la URL. La solución es doble:
1. **Mapeo de claves cortas** — cada clave de `localStorage` se renombra a 1 carácter antes de serializar.
2. **LZ-String** — comprime el JSON resultante y lo convierte a un string 100% URL-safe via `compressToEncodedURIComponent`.

---

## 2. Arquitectura de datos

### Diccionario de claves cortas (Short-Key Map)

| Clave corta | Clave en `localStorage` | Tipo | Estrategia de fusión |
|---|---|---|---|
| `u` | `desbloqueados` | `Array<string>` | **Union** — se añaden sin duplicados |
| `f` | `favoritos` | `Array<string>` | **Union** — se añaden sin duplicados |
| `l` | `logrosAlcanzados` | `Array<string>` | **Union** — se añaden sin duplicados |
| `e` | `readEmails` | `Array<string>` | **Union** — se añaden sin duplicados |
| `s` | `streak` | `number` | `Math.max(local, importado)` |
| `m` | `minutesOnPage` | `number` | `Math.max(local, importado)` |
| `t` | *(timestamp)* | `number` | Solo informativo, no se fusiona |

### Estructura del token (antes de comprimir)

```json
{
  "u": ["codigo1", "codigo2"],
  "f": ["codigo1"],
  "l": ["primer_secreto", "coleccionista"],
  "e": ["email_001"],
  "s": 7,
  "m": 42,
  "t": 1708444800000
}
```

### URL generada

```
https://usuario.github.io/app/?sync=<LZString_comprimido>
```

---

## 3. Flujo completo

### 3.1 Exportación (dispositivo de origen)

```
Usuario abre Menú → Copia de Seguridad → Sincronizar por QR
           ↓
UIManager.openSyncQRModal()
           ↓
UIManager.generateSyncToken()
  - Lee localStorage con claves cortas
  - JSON.stringify → LZString.compressToEncodedURIComponent
  - Retorna token string
           ↓
Construye syncURL = origin + pathname + ?sync=<token>
           ↓
Llama a api.qrserver.com con syncURL como data
           ↓
Modal muestra <img> con el QR generado
```

### 3.2 Importación (dispositivo de destino)

```
Usuario escanea el QR con la cámara del móvil
           ↓
Navegador abre la syncURL
           ↓
GameEngine.init() → GameEngine.checkIncomingSync()
           ↓
URLSearchParams detecta ?sync=<token>
           ↓
window.history.replaceState() → elimina ?sync de la barra de direcciones
           ↓
LZString.decompressFromEncodedURIComponent(token) → JSON string
           ↓
JSON.parse → incomingData object
           ↓
GameEngine.mergeSyncData(incomingData)
           ↓
confirm() → usuario acepta o rechaza
           ↓  (si acepta)
fuseSet para u, f, l, e  (Union vía Set)
Math.max para s, m
localStorage.setItem para cada clave
           ↓
window.location.reload()
```

---

## 4. Referencia de API interna

### `UIManager.generateSyncToken(): string`

Empaqueta el estado actual del usuario y lo devuelve comprimido.

```javascript
const token = uiManager.generateSyncToken();
// → "N4IghgRgBg..."  (string URL-safe)
```

**Dependencias:** `LZString` (global), `localStorage`.  
**No tiene efectos secundarios.**

---

### `UIManager.openSyncQRModal(): void`

Genera el token, construye la URL, solicita el QR a la API externa y muestra el modal.

Guarda en `this.elements.syncQRImage.src` la URL del QR. Al cerrar el modal, `src` se limpia para liberar la petición de red.

**Falla silenciosamente** si `LZString` no está disponible (muestra toast de error en su lugar).

---

### `UIManager.closeSyncQRModal(): void`

Oculta el modal y resetea `src` del `<img>` a vacío.

---

### `GameEngine.checkIncomingSync(): void`

Invocado al inicio de `init()`. Lee `?sync=` de la URL, **siempre limpia la URL** antes de procesar (para evitar bucles de sincronización al refrescar), y lanza `mergeSyncData`.

**Manejo de errores:**
- `LZString` no disponible → log + alert amigable
- Token malformado / vacío → `catch` → alert amigable
- Estructura de datos inválida → `catch` → alert amigable

---

### `GameEngine.mergeSyncData(data: Object): void`

Fusiona los datos del objeto `data` con `localStorage` según la estrategia de la tabla de Short-Keys.

Pide confirmación al usuario antes de modificar nada. Si el usuario cancela, **no se modifica ningún dato**.

---

## 5. Guía de pruebas (QA)

### Test 1 — Generación básica

1. Desbloquear 3+ códigos en el Dispositivo A.
2. Ir a Menú → Copia de Seguridad → Sincronizar por QR.
3. **Esperado:** El modal se abre y muestra un código QR visible (cuadrado con módulos negros sobre fondo blanco).
4. **Esperado:** El QR tiene fondo blanco sólido, no glassmorphism.

### Test 2 — Fusión correcta

1. **Dispositivo A:** 10 códigos desbloqueados, racha = 5 días.
2. **Dispositivo B:** 5 códigos (2 exclusivos del B), racha = 3 días.
3. Escanear QR del A en el B.
4. **Esperado tras fusión:** 12 códigos únicos, racha = 5.

### Test 3 — Higiene de URL

1. Escanear QR. El navegador abre la URL con `?sync=...`.
2. **Esperado:** Antes de mostrar el `confirm`, la URL ya muestra solo el pathname base (sin `?sync`).
3. Aceptar. Tras el `reload`, la URL sigue sin `?sync`.

### Test 4 — Resistencia a fallos

1. Navegar manualmente a `?sync=basura_no_valida`.
2. **Esperado:** Alert indicando que el código es inválido. La app continúa funcionando normalmente.

### Test 5 — Botón Copiar enlace

1. Abrir modal QR → clic en "Copiar enlace".
2. Pegar en un editor de texto.
3. **Esperado:** URL completa con `?sync=<token>` comprimido.
4. Abrir la URL en otra pestaña/dispositivo → proceso de importación normal.

### Test 6 — Compatibilidad cross-browser

| Origen | Destino | Resultado esperado |
|---|---|---|
| Chrome Desktop | Chrome Android | ✓ QR escaneable |
| Chrome Desktop | Safari iOS | ✓ QR escaneable |
| Firefox Desktop | Samsung Internet | ✓ QR escaneable |

---

## 6. Limitaciones conocidas

### Longitud máxima de URL

LZ-String reduce el tamaño significativamente, pero si un usuario tiene **cientos de códigos desbloqueados**, el token podría acercarse al límite de ~2 000 caracteres. En ese caso el QR se vuelve muy denso.

**Mitigación actual:** el parámetro `ecc=L` (Error Correction Low) en la API del QR reduce el número de módulos, mejorando la densidad y la legibilidad.

**Solución futura si fuera necesario:** paginar los datos o usar solo un hash de referencia.

### Dependencia de red para el QR

El QR se genera mediante una llamada a `api.qrserver.com`. Si el dispositivo de origen no tiene conexión, el `<img>` no cargará.

**Workaround:** usar el botón "Copiar enlace" y enviar el enlace por mensaje/email.

### LZString como global

La librería se carga como script clásico (no módulo) para ser accesible como `window.LZString`. Si el script de LZ-String falla al cargar (CDN caído), tanto la generación como la importación fallarán con un mensaje claro al usuario.
