/**
 * svgIcons.js
 * Iconos SVG inline para reemplazar emojis
 * Siguiendo la línea gráfica y lenguaje visual de la aplicación
 */

export const SVGIcons = {
    // Bombilla - Pista/Ayuda
    lightBulb: `<svg class="svg-icon icon-lightbulb" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.3"/>
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" fill="currentColor"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm3 12.7V17h-2v-2.3l-.29-.14C10.9 13.71 10 11.48 10 9c0-1.1.9-2 2-2s2 .9 2 2c0 2.48-.9 4.71-2.71 5.56l-.29.14V17h-2v-2.3C7.19 13.47 6 11.38 6 9c0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.38-1.19 4.47-3 5.74z" fill="currentColor"/>
    </svg>`,

    // Error/Incorrecto
    error: `<svg class="svg-icon icon-error" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z" fill="currentColor"/>
    </svg>`,

    // Éxito/Correcto
    success: `<svg class="svg-icon icon-success" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="currentColor"/>
    </svg>`,

    // Candado cerrado
    lock: `<svg class="svg-icon icon-lock" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" fill="currentColor"/>
        <path d="M6 10h12v10H6z" fill="currentColor" opacity="0.3"/>
    </svg>`,

    // Candado abierto
    unlocked: `<svg class="svg-icon icon-unlocked" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8h-7V6c0-1.66 1.34-3 3-3s3 1.34 3 3h2c0-2.76-2.24-5-5-5S9 3.24 9 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>
        <path d="M6 10h12v10H6z" fill="currentColor" opacity="0.3"/>
    </svg>`,

    // Celebración
    celebration: `<svg class="svg-icon icon-celebration" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 20l4-8 8 4-8 4zm3-5.5L6.5 19l4.5-2.25L6.5 14.5 5 14.5zM19 2l-8 4 4 8 4-8zm-5 6.5L11.5 4l4.5 2.25L13.5 8.5 14 8.5z" fill="currentColor" opacity="0.3"/>
        <path d="M11.5 9.5L9 4l2.5 5.5 5.5 2.5-8 8zm-5-5l-2 4 4 2 2-4-4-2zm10-2l-4 2 2 4 4-2-2-4zm3 10l-2 4 4 2 2-4-4-2zm-10 6l-2 4 4 2 2-4-4-2z" fill="currentColor"/>
    </svg>`,

    // Trofeo
    trophy: `<svg class="svg-icon icon-trophy" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 6c-1.65 0-3-1.35-3-3V5h6v6c0 1.65-1.35 3-3 3zm7-6c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="currentColor"/>
        <path d="M9 5h6v6c0 1.65-1.35 3-3 3s-3-1.35-3-3V5z" fill="currentColor" opacity="0.3"/>
    </svg>`,

    // Fuego/Racha
    fire: `<svg class="svg-icon icon-fire" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 2.67l.84 2.46c.54 1.57-.02 3.29-1.39 4.22-1.88 1.28-2.95 3.42-2.95 5.65 0 3.58 2.92 6.5 6.5 6.5s6.5-2.92 6.5-6.5c0-1.78-.7-3.39-1.85-4.58l.5-1.42c.89 1.35 1.35 2.94 1.35 4.58 0 4.96-4.04 9-9 9s-9-4.04-9-9c0-3.05 1.57-5.76 3.97-7.35l.83-2.43z" fill="currentColor" opacity="0.3"/>
        <path d="M12 12.9l-2.13-2.09C9.31 10.27 9 9.55 9 8.77c0-1.4 1.09-2.6 2.47-2.77.91-.11 1.77.21 2.41.85.64-.64 1.5-.96 2.41-.85C17.91 6.17 19 7.37 19 8.77c0 .78-.31 1.5-.87 2.04L12 17.1l-2.13-2.09z" fill="currentColor"/>
    </svg>`,

    // Brillos/Estrellas
    sparkles: `<svg class="svg-icon icon-sparkles" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" fill="currentColor" opacity="0.3"/>
        <path d="M19 9l1.5 4.5L25 15l-4.5 1.5L19 21l-1.5-4.5L13 15l4.5-1.5L19 9zM8 1l1.125 3.375L12.5 5.5l-3.375 1.125L8 10l-1.125-3.375L3.5 5.5l3.375-1.125L8 1z" fill="currentColor"/>
    </svg>`,

    // Luna
    moon: `<svg class="svg-icon icon-moon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z" fill="currentColor"/>
        <path d="M12 3c.46 0 .92.04 1.36.1C11.99 3.47 11 5.08 11 7c0 2.98 2.42 5.4 5.4 5.4 1.92 0 3.53-.99 4.5-2.36.06.44.1.9.1 1.36 0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9z" fill="currentColor" opacity="0.3"/>
    </svg>`,

    // Estrella brillante
    star: `<svg class="svg-icon icon-star" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
        <path d="M12 2l2.81 6.63L22 9.24l-5.46 4.73L18.18 21 12 17.27z" fill="currentColor" opacity="0.3"/>
    </svg>`,

    // Corazón
    heart: `<svg class="svg-icon icon-heart" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
    </svg>`,

    // Corazón morado (relleno especial para el color)
    heartPurple: `<svg class="svg-icon icon-heart-purple" width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
    </svg>`
};

/**
 * Función helper para obtener el SVG como string HTML
 * @param {string} iconName - Nombre del icono
 * @param {string} className - Clase CSS adicional opcional
 * @returns {string} HTML del SVG
 */
export function getSVGIcon(iconName, className = '') {
    const icon = SVGIcons[iconName];
    if (!icon) {
        console.warn(`Icon "${iconName}" not found`);
        return '';
    }
    
    // Si hay una clase adicional, la añadimos al SVG
    if (className) {
        return icon.replace('class="svg-icon', `class="svg-icon ${className}`);
    }
    
    return icon;
}

/**
 * Función helper para crear un elemento SVG
 * @param {string} iconName - Nombre del icono
 * @param {string} className - Clase CSS adicional opcional
 * @returns {HTMLElement} Elemento contenedor con el SVG
 */
export function createSVGIcon(iconName, className = '') {
    const span = document.createElement('span');
    span.className = `svg-icon-wrapper ${className}`;
    span.innerHTML = getSVGIcon(iconName);
    return span;
}
