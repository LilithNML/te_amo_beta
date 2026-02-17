/**
 * main.js
 * Punto de entrada principal con carga de base de datos JSON.
 * Versión 2.0 - Con Audio Manager integrado
 */
import { UIManager } from './modules/uiManager.js';
import { AudioManager } from './modules/audioManager.js';
import { GameEngine } from './modules/gameEngine.js';
import { BackgroundEngine } from './modules/backgroundEngine.js';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Cargar la base de datos desde el archivo JSON
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error("No se pudo cargar la base de datos");
        const data = await response.json();

        // 2. Cargar frases del oráculo
        const oracleResponse = await fetch('./oracle.json');
        const oracleData = await oracleResponse.json();

        // 3. Inicializar Fondo Dinámico
        const backgroundEngine = new BackgroundEngine();

        // 4. Inicializar Interfaz con sus herramientas
        const ui = new UIManager(data.herramientasExternas, oracleData.phrases);
        
        // 5. Inicializar Audio
        const audio = new AudioManager(ui);
        
        // Exponer audioManager globalmente para acceso desde uiManager y gameEngine
        window.audioManager = audio;

        // 6. Conectar controles del modal de audio
        setupAudioControls(audio);

        // 7. Inicializar Motor del Juego con los mensajes y logros cargados
        const game = new GameEngine(ui, audio, data.mensajes, data.logros);

    } catch (error) {
        console.error("Error crítico al iniciar la aplicación:", error);
        alert("Hubo un problema al cargar los datos. Por favor, recarga la página.");
    }
});

/**
 * Configurar event listeners para controles del modal de audio
 */
function setupAudioControls(audioManager) {
    const playPauseBtn = document.getElementById("audioPlayPause");
    const prevBtn = document.getElementById("audioPrev");
    const nextBtn = document.getElementById("audioNext");
    const shuffleBtn = document.getElementById("audioShuffle");
    const muteBtn = document.getElementById("audioMute");
    const volumeSlider = document.getElementById("volumeSlider");

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            audioManager.toggleMusic();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            audioManager.prevTrack();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            audioManager.nextTrack();
        });
    }

    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", () => {
            audioManager.toggleShuffle();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            audioManager.toggleMute();
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            audioManager.setVolume(parseFloat(e.target.value));
        });
    }
}
