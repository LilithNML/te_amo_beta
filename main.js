/**
 * main.js
 * Punto de entrada principal con carga de base de datos JSON.
 * Versión 2.1 - Seek bar + autoplay fix
 */
import { UIManager } from './modules/uiManager.js';
import { AudioManager } from './modules/audioManager.js';
import { GameEngine } from './modules/gameEngine.js';
import { BackgroundEngine } from './modules/backgroundEngine.js';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error("No se pudo cargar la base de datos");
        const data = await response.json();

        const oracleResponse = await fetch('./oracle.json');
        const oracleData = await oracleResponse.json();

        const backgroundEngine = new BackgroundEngine();
        const ui = new UIManager(data.herramientasExternas, oracleData.phrases);
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

function setupAudioControls(audioManager) {
    const playPauseBtn = document.getElementById("audioPlayPause");
    const prevBtn      = document.getElementById("audioPrev");
    const nextBtn      = document.getElementById("audioNext");
    const shuffleBtn   = document.getElementById("audioShuffle");
    const muteBtn      = document.getElementById("audioMute");
    const volumeSlider = document.getElementById("volumeSlider");
    const seekBar      = document.getElementById("audioSeekBar");

    if (playPauseBtn) playPauseBtn.addEventListener("click", () => audioManager.toggleMusic());
    if (prevBtn)      prevBtn.addEventListener("click",      () => audioManager.prevTrack());
    if (nextBtn)      nextBtn.addEventListener("click",      () => audioManager.nextTrack());
    if (shuffleBtn)   shuffleBtn.addEventListener("click",   () => audioManager.toggleShuffle());
    if (muteBtn)      muteBtn.addEventListener("click",      () => audioManager.toggleMute());

    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            audioManager.setVolume(parseFloat(e.target.value));
        });
    }

    if (seekBar) {
        // Pausar actualizaciones automáticas mientras el usuario arrastra
        seekBar.addEventListener("mousedown",  () => { audioManager._isSeeking = true; });
        seekBar.addEventListener("touchstart", () => { audioManager._isSeeking = true; }, { passive: true });

        // Actualizar relleno de color mientras arrastra
        seekBar.addEventListener("input", (e) => {
            audioManager._updateSeekFill(e.target);
        });

        // Al soltar: saltar a la posición seleccionada
        seekBar.addEventListener("mouseup",  (e) => {
            audioManager._isSeeking = false;
            audioManager.seekTo(parseFloat(e.target.value));
        });
        seekBar.addEventListener("touchend", (e) => {
            audioManager._isSeeking = false;
            audioManager.seekTo(parseFloat(e.target.value));
        });
        seekBar.addEventListener("change", (e) => {
            audioManager._isSeeking = false;
            audioManager.seekTo(parseFloat(e.target.value));
        });
    }
}

/**
 * Arrancar el intervalo de la seek bar al abrir el modal y detenerlo al cerrarlo.
 */
function setupSeekBarLifecycle(audioManager) {
    const audioModal      = document.getElementById("audioModal");
    const closeAudioModal = document.getElementById("closeAudioModal");
    const menuAudio       = document.getElementById("menuAudio");

    if (menuAudio) {
        menuAudio.addEventListener("click", () => audioManager.startSeekBarUpdater());
    }

    if (closeAudioModal) {
        closeAudioModal.addEventListener("click", () => audioManager.stopSeekBarUpdater());
    }

    // Detectar cierre por click fuera del modal
    if (audioModal) {
        const observer = new MutationObserver(() => {
            if (!audioModal.classList.contains("show")) {
                audioManager.stopSeekBarUpdater();
            }
        });
        observer.observe(audioModal, { attributes: true, attributeFilter: ["class"] });
    }
}
