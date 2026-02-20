# Changelog - Lumen Editor

Todas las modificaciones notables de este proyecto serán documentadas en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto adhiere a versionado semántico.

## [2.0.0] - 2026-02-11

Versión mayor que introduce un sistema de búsqueda global, reescribe la gestión de estado para mayor rendimiento y endurece las validaciones de datos para garantizar la integridad del JSON exportado.

### Añadido (Nuevas Funcionalidades)
- **Búsqueda Global Inteligente:**
  - Nueva barra de búsqueda accesible con `Ctrl+K` o `Cmd+K`.
  - Búsqueda difusa (fuzzy search) por nombre, ID, categoría, pista o contenido.
  - Navegación completa por teclado (`↓`, `↑`, `Enter`, `Esc`).
  - Ordenamiento de resultados por relevancia.
- **Categorización Automática:** El campo "Categoría" ahora se asigna automáticamente (oculto al usuario) basado en el `type` seleccionado (ej. `text` → "Carta", `video` → "YouTube").
- **Logging de Errores en Importación:** Nuevo modal que reporta detalladamente qué elementos fallaron al importar un JSON y por qué.
- **Protección de Cambio de Tipo:** Modal de confirmación al cambiar el `type` de un mensaje existente para prevenir pérdida accidental de datos en campos dinámicos.
- **Feedback Visual:** Indicadores en tiempo real (rojo) para IDs duplicados.

### Cambiado (Mejoras)
- **Migración a Map:** El estado interno `appState.mensajes` migró de Objeto plano a `Map` para preservar el orden de inserción y mejorar la eficiencia en iteraciones.
- **Interfaz sin Emojis:** Se reemplazaron todos los emojis de la UI por iconos SVG para una apariencia profesional y consistente.
- **Simplificación de Descargas:** El tipo `download` ahora solo requiere un campo (nombre del archivo). La estructura de objeto `url/nombre` se construye internamente al guardar.
- **Formato de Exportación:** Los saltos de línea en el campo `texto` ahora se escapan correctamente como literales `\n` en el JSON final.

### Seguridad y Validación
- **Bloqueo de IDs Duplicados:** El sistema ahora impide físicamente guardar si el ID normalizado ya existe.
- **Validación Estricta por Tipo:**
  - `video`: Requiere extracción válida de ID de YouTube (11 caracteres). Soporta `youtu.be`, `shorts` y URLs estándar.
  - `image`/`audio`: Valida extensiones de archivo permitidas.
  - `link`: Requiere protocolo `http://` o `https://`.
- **Pre-validación de Export:** Bloquea la descarga del JSON si existen errores pendientes o modales abiertos.

---

## [1.0.0] - Versión Inicial

Lanzamiento original del editor visual para la gestión de contenido dinámico Lumen.

### Características Principales
- **Editor Visual (SPA):** Interfaz para gestionar estructuras JSON complejas sin tocar código.
- **Arquitectura "Zero Dependencies":** Construido con Vanilla JS, HTML5 y CSS3 para máxima portabilidad.
- **Persistencia Local:** Guardado automático de sesión utilizando `LocalStorage API` para evitar pérdida de datos.
- **Gestión de Assets:**
  - Sistema de rutas dinámicas prefijadas (`assets/unlocked_content/...`).
  - Normalización automática de IDs (slugs: minúsculas, sin acentos).
- **Tipos de Contenido Soportados:** Texto, Video (Embed), Imagen, Audio, Descargas encriptadas.
- **Gamificación:** Gestión de colección de `logros` y `mensajes`.
- **Import/Export:** Capacidad de cargar y descargar archivos `data.json` compatibles con Lumen Data Core.

---

## Referencia Técnica

### Estructura de Datos (JSON v2.0)

El archivo `data.json` generado sigue esta estructura estricta:

```json
{
  "mensajes": {
    "id_normalizado": {
      "type": "text|video|image|audio|download|image_audio|link|internal",
      "categoria": "Categoría Automática",
      "pista": "Texto de pista visible antes de desbloquear",
      // Campos dinámicos según el tipo:
      "texto": "Contenido con \\n literales",
      "videoEmbed": "[https://www.youtube.com/embed/ID](https://www.youtube.com/embed/ID)",
      "imagen": "assets/unlocked_content/images/archivo.jpg",
      "audio": "assets/unlocked_content/audio/archivo.ogg",
      "descarga": {
        "url": "assets/unlocked_content/encrypted/archivo.wenc",
        "nombre": "archivo.wenc"
      }
    }
  },
  "logros": [
    {
      "id": "logro_id",
      "codigo_requerido": 5,
      "mensaje": "¡Has desbloqueado 5 recuerdos!"
    }
  ]
}
