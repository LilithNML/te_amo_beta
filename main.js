/**
 * main.js
 * Versión 2.2 — Seek bar sinusoidal canvas
 */
import { UIManager }        from './modules/uiManager.js';
import { AudioManager }     from './modules/audioManager.js';
import { GameEngine }       from './modules/gameEngine.js';
import { BackgroundEngine } from './modules/backgroundEngine.js';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error("No se pudo cargar la base de datos");
        const data = await response.json();

        const oracleResponse = await fetch('./oracle.json');
        const oracleData     = await oracleResponse.json();

        const backgroundEngine = new BackgroundEngine();
        const ui    = new UIManager(data.herramientasExternas, oracleData.phrases);
        const audio = new AudioManager(ui);

        window.audioManager = audio;

        setupAudioControls(audio);
        setupSeekBarLifecycle(audio);

        const game = new GameEngine(ui, audio, data.mensajes, data.logros);

    } catch (error) {
        console.error("Error crítico al iniciar la aplicación:", error);
        alert("Hubo un problema al cargar los datos. Por favor, recarga la página.");
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  CONTROLES DEL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function setupAudioControls(audioManager) {
    const get = (id) => document.getElementById(id);

    const btn = (id, fn) => { const el = get(id); if (el) el.addEventListener("click", fn); };

    btn("audioPlayPause", () => audioManager.toggleMusic());
    btn("audioPrev",      () => audioManager.prevTrack());
    btn("audioNext",      () => audioManager.nextTrack());
    btn("audioShuffle",   () => audioManager.toggleShuffle());
    btn("audioMute",      () => audioManager.toggleMute());

    const vol = get("volumeSlider");
    if (vol) vol.addEventListener("input", (e) => audioManager.setVolume(parseFloat(e.target.value)));

    // Seek bar canvas
    setupCanvasSeek(audioManager);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SEEK BAR CANVAS — interacción táctil / ratón
// ─────────────────────────────────────────────────────────────────────────────
function setupCanvasSeek(audioManager) {
    const canvas = document.getElementById("audioSeekCanvas");
    if (!canvas) return;

    /** Convierte posición X del evento a ratio 0-1 */
    const xToRatio = (clientX) => {
        const rect = canvas.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    };

    // ── Mouse ──────────────────────────────────────────────────────────────
    canvas.addEventListener("mousedown", (e) => {
        audioManager._isSeeking = true;
        audioManager.seekPreview(xToRatio(e.clientX));
    });

    window.addEventListener("mousemove", (e) => {
        if (!audioManager._isSeeking) return;
        audioManager.seekPreview(xToRatio(e.clientX));
    });

    window.addEventListener("mouseup", (e) => {
        if (!audioManager._isSeeking) return;
        const ratio = xToRatio(e.clientX);
        audioManager._isSeeking = false;
        audioManager.seekTo(ratio * 100);
    });

    // ── Touch ──────────────────────────────────────────────────────────────
    canvas.addEventListener("touchstart", (e) => {
        audioManager._isSeeking = true;
        audioManager.seekPreview(xToRatio(e.touches[0].clientX));
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
        if (!audioManager._isSeeking) return;
        audioManager.seekPreview(xToRatio(e.touches[0].clientX));
    }, { passive: true });

    canvas.addEventListener("touchend", (e) => {
        if (!audioManager._isSeeking) return;
        const ratio = xToRatio(e.changedTouches[0].clientX);
        audioManager._isSeeking = false;
        audioManager.seekTo(ratio * 100);
    });

    // Tap simple (click sin drag)
    canvas.addEventListener("click", (e) => {
        if (audioManager._isSeeking) return; // ya gestionado por mouseup
        audioManager.seekTo(xToRatio(e.clientX) * 100);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  CICLO DE VIDA DEL ANIMADOR (arrancar/parar con el modal)
// ─────────────────────────────────────────────────────────────────────────────
function setupSeekBarLifecycle(audioManager) {
    const audioModal      = document.getElementById("audioModal");
    const closeAudioModal = document.getElementById("closeAudioModal");
    const menuAudio       = document.getElementById("menuAudio");

    // Abrir modal → iniciar rAF loop + reconfigurar canvas
    if (menuAudio) {
        menuAudio.addEventListener("click", () => {
            // Pequeño delay para que el modal sea visible antes de medir el canvas
            requestAnimationFrame(() => audioManager.startSeekBarUpdater());
        });
    }

    // Cerrar modal (botón X) → detener rAF loop
    if (closeAudioModal) {
        closeAudioModal.addEventListener("click", () => audioManager.stopSeekBarUpdater());
    }

    // Cerrar modal (click fuera) → MutationObserver sobre la clase "show"
    if (audioModal) {
        new MutationObserver(() => {
            if (!audioModal.classList.contains("show")) {
                audioManager.stopSeekBarUpdater();
            }
        }).observe(audioModal, { attributes: true, attributeFilter: ["class"] });
    }
}
