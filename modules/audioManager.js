/**
 * modules/audioManager.js
 * Versión 2.0 - Sistema de Audio Completo
 * - Playlist con covers
 * - Efectos de sonido con Web Audio API
 * - Sistema de interrupciones inteligentes
 * - Autoplay después de primer click
 */

export class AudioManager {
    constructor(uiManager) {
        this.ui = uiManager;
        
        // HTML Audio Element para música de fondo
        this.bgMusic = document.getElementById("bgMusic");
        
        // Web Audio API Context para efectos de sonido
        this.audioContext = null;
        this.masterGain = null;
        
        // Playlist con metadata completa
        this.playlist = [
            {
                src: "assets/audio/playlist/Olivia Newton-John - Hopelessly Devoted to You.mp3",
                cover: "assets/images/music-cover/hopelessly-devoted.jpg",
                title: "Hopelessly Devoted to You",
                artist: "Olivia Newton-John"
            },
            {
                src: "assets/audio/playlist/Morten Harket - Cant Take My Eyes off You.mp3",
                cover: "assets/images/music-cover/cant-take-my-eyes.jpg",
                title: "Can't Take My Eyes Off You",
                artist: "Morten Harket"
            },
            {
                src: "assets/audio/playlist/Frank Sinatra - The World We Knew (Over and Over).mp3",
                cover: "assets/images/music-cover/the-world-we-knew.jpg",
                title: "The World We Knew",
                artist: "Frank Sinatra"
            },
            {
                src: "assets/audio/playlist/Frank Sinatra - Strangers In The Night.mp3",
                cover: "assets/images/music-cover/strangers-in-the-night.jpg",
                title: "Strangers In The Night",
                artist: "Frank Sinatra"
            },
            {
                src: "assets/audio/playlist/Frank Sinatra - My Way Of Life.mp3",
                cover: "assets/images/music-cover/my-way-of-life.jpg",
                title: "My Way Of Life",
                artist: "Frank Sinatra"
            }
        ];
        
        // Estado del reproductor
        this.currentTrackIndex = parseInt(localStorage.getItem("currentTrack") || "0");
        this.isShuffling = localStorage.getItem("audioShuffle") === "true";
        this.isMuted = localStorage.getItem("audioMuted") === "true";
        this.volume = parseFloat(localStorage.getItem("audioVolume") || "0.3");
        this.isPlaying = false;
        this.isReady = false; // Flag para autoplay
        this._isSeeking = false; // Flag para seek bar dragging
        this._seekInterval = null; // Intervalo de actualización de seek bar
        
        // Estado de interrupciones
        this.isBackgroundPaused = false;
        this.volumeBeforePause = this.volume;
        
        this.init();
    }

    init() {
        // Configurar audio element
        if (this.bgMusic) {
            this.bgMusic.volume = this.volume;
            this.bgMusic.muted = this.isMuted;
            this.bgMusic.loop = false; // Manejaremos el loop manualmente
            this.bgMusic.addEventListener("ended", () => this.nextTrack());
        }
        
        // Configurar autoplay con primer click del usuario
        this.setupAutoplayTrigger();
    }

    /**
     * Configurar trigger de autoplay (primer toque/click del usuario).
     * Los navegadores móviles requieren un gesto del usuario para desbloquear audio.
     */
    setupAutoplayTrigger() {
        const startAudio = async () => {
            if (this.isReady) return;
            this.isReady = true;

            // 1. Inicializar Web Audio API para efectos de sonido
            this.initAudioContext();

            // 2. Si el AudioContext quedó suspendido (comportamiento común en mobile),
            //    reanudarlo explícitamente dentro del handler del gesto
            if (this.audioContext && this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }

            // 3. Iniciar reproducción de playlist
            this.startPlaylist();
        };

        // "touchend" en lugar de "touchstart" para evitar colisiones con el scroll en Android.
        // "mousedown" para desktop. { once: true } garantiza ejecución única.
        document.addEventListener("touchend", startAudio, { once: true, passive: true });
        document.addEventListener("mousedown", startAudio, { once: true });
    }

    /**
     * Inicializar Web Audio API Context
     */
    initAudioContext() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 1.0;
        } catch (error) {
            console.warn("Web Audio API no disponible:", error);
        }
    }

    /**
     * Iniciar playlist automáticamente
     */
    startPlaylist() {
        if (!this.bgMusic) return;
        // Nota: no bloqueamos con this.isPlaying para garantizar el inicio en autoplay
        this._loadAndPlay();
    }

    /**
     * Iniciar actualización de la seek bar (llamado al abrir el modal)
     */
    startSeekBarUpdater() {
        this.stopSeekBarUpdater();
        this._seekInterval = setInterval(() => this._updateSeekBar(), 500);
    }

    /**
     * Detener actualización de la seek bar
     */
    stopSeekBarUpdater() {
        if (this._seekInterval) {
            clearInterval(this._seekInterval);
            this._seekInterval = null;
        }
    }

    /**
     * Actualizar seek bar con posición actual
     */
    _updateSeekBar() {
        if (!this.bgMusic) return;
        const seekBar  = document.getElementById("audioSeekBar");
        const timeCur  = document.getElementById("audioTimeCurrent");
        const timeTot  = document.getElementById("audioTimeTotal");

        const current  = this.bgMusic.currentTime || 0;
        const duration = this.bgMusic.duration   || 0;

        if (seekBar && !this._isSeeking) {
            seekBar.value = duration > 0 ? (current / duration) * 100 : 0;
            this._updateSeekFill(seekBar);
        }

        if (timeCur) timeCur.textContent = this._formatTime(current);
        if (timeTot) timeTot.textContent = this._formatTime(duration);
    }

    /**
     * Actualizar el relleno del track de la seek bar (color progresado)
     */
    _updateSeekFill(range) {
        const val = parseFloat(range.value);
        const min = parseFloat(range.min) || 0;
        const max = parseFloat(range.max) || 100;
        const pct = ((val - min) / (max - min)) * 100;
        range.style.setProperty("--seek-fill", `${pct}%`);
    }

    /**
     * Saltar a posición en la seek bar
     */
    seekTo(percent) {
        if (!this.bgMusic || !this.bgMusic.duration) return;
        this.bgMusic.currentTime = (percent / 100) * this.bgMusic.duration;
        this._updateSeekBar();
    }

    /**
     * Formatear segundos a MM:SS
     */
    _formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    /**
     * Toggle Play/Pause
     */
    toggleMusic() {
        if (!this.bgMusic) return;
        
        if (this.bgMusic.paused) {
            this.bgMusic.play().catch(e => console.warn("Autoplay bloqueado:", e));
            this.isPlaying = true;
        } else {
            this.bgMusic.pause();
            this.isPlaying = false;
        }
        
        this.updateUI();
    }

    /**
     * Siguiente canción
     */
    nextTrack() {
        if (this.isShuffling) {
            // Shuffle: canción aleatoria
            this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            // Normal: siguiente en orden (loop)
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        }
        this._loadAndPlay();
    }

    /**
     * Canción anterior
     */
    prevTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this._loadAndPlay();
    }

    /**
     * Saltar a una canción específica
     */
    playTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            this._loadAndPlay();
        }
    }

    /**
     * Cargar y reproducir canción actual
     */
    _loadAndPlay() {
        if (!this.bgMusic) return;
        
        const track = this.playlist[this.currentTrackIndex];
        this.bgMusic.src = track.src;
        localStorage.setItem("currentTrack", this.currentTrackIndex.toString());
        
        this.bgMusic.play()
            .then(() => {
                this.isPlaying = true;
                this.updateUI();
            })
            .catch(e => console.warn("Play error:", e));
    }

    /**
     * Toggle Shuffle
     */
    toggleShuffle() {
        this.isShuffling = !this.isShuffling;
        localStorage.setItem("audioShuffle", this.isShuffling.toString());
        this.ui.showToast(this.isShuffling ? "🔀 Aleatorio Activado" : "▶️ Orden Normal");
        this.updateUI();
    }

    /**
     * Toggle Mute
     */
    toggleMute() {
        if (!this.bgMusic) return;
        
        this.isMuted = !this.isMuted;
        this.bgMusic.muted = this.isMuted;
        localStorage.setItem("audioMuted", this.isMuted.toString());
        this.ui.showToast(this.isMuted ? "🔇 Silenciado" : "🔊 Audio Activado");
        this.updateUI();
    }

    /**
     * Ajustar volumen
     */
    setVolume(value) {
        if (!this.bgMusic) return;
        
        this.volume = Math.max(0, Math.min(1, value));
        this.bgMusic.volume = this.volume;
        localStorage.setItem("audioVolume", this.volume.toString());
        this.updateUI();
    }

    /**
     * Pausar música de fondo (para interrupciones de multimedia)
     */
    pauseBackground() {
        if (!this.bgMusic || this.isBackgroundPaused) return;
        
        this.isBackgroundPaused = true;
        this.volumeBeforePause = this.bgMusic.volume;
        
        // Fade out suave
        this._fadeVolume(this.bgMusic.volume, 0, 500, () => {
            this.bgMusic.pause();
        });
    }

    /**
     * Reanudar música de fondo (después de interrupciones)
     */
    resumeBackground() {
        if (!this.bgMusic || !this.isBackgroundPaused) return;
        
        this.isBackgroundPaused = false;
        
        // Reanudar con fade in
        this.bgMusic.volume = 0;
        this.bgMusic.play()
            .then(() => {
                this._fadeVolume(0, this.volumeBeforePause, 1500);
            })
            .catch(e => console.warn("Resume error:", e));
    }

    /**
     * Fade de volumen suave
     */
    _fadeVolume(fromVolume, toVolume, duration, callback) {
        if (!this.bgMusic) return;
        
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = (toVolume - fromVolume) / steps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = fromVolume + (volumeStep * currentStep);
            this.bgMusic.volume = Math.max(0, Math.min(1, newVolume));
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                this.bgMusic.volume = toVolume;
                if (callback) callback();
            }
        }, stepDuration);
    }

    /**
     * Obtener información de la canción actual
     */
    getCurrentTrack() {
        return this.playlist[this.currentTrackIndex];
    }

    /**
     * Actualizar UI del reproductor
     */
    updateUI() {
        if (this.ui.updateAudioModal) {
            this.ui.updateAudioModal({
                isPlaying: this.isPlaying,
                isMuted: this.isMuted,
                isShuffling: this.isShuffling,
                volume: this.volume,
                currentTrackIndex: this.currentTrackIndex,
                playlist: this.playlist
            });
        }
        // Actualizar seek bar inmediatamente
        this._updateSeekBar();
    }

    // ===========================================
    // EFECTOS DE SONIDO (Web Audio API)
    // ===========================================

    /**
     * Reproducir sonido de éxito (correcto)
     */
    playCorrect() {
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        // Acorde mayor ascendente: Do (261.63 Hz) -> Mi (329.63 Hz) -> Sol (392 Hz)
        const frequencies = [261.63, 329.63, 392.00];
        const noteDuration = 0.13; // Duración de cada nota
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            // Envelope: Attack rápido, Decay suave
            gainNode.gain.setValueAtTime(0, now + (index * noteDuration));
            gainNode.gain.linearRampToValueAtTime(0.3, now + (index * noteDuration) + 0.02); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + (index * noteDuration) + noteDuration); // Decay
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start(now + (index * noteDuration));
            oscillator.stop(now + (index * noteDuration) + noteDuration);
        });
    }

    /**
     * Reproducir sonido de error (incorrecto)
     */
    playIncorrect() {
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        // Dos notas descendentes: La (220 Hz) -> Fa (174.61 Hz)
        const frequencies = [220.00, 174.61];
        const noteDuration = 0.15;
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = freq;
            
            // Filtro lowpass para suavizar
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            filter.Q.value = 1;
            
            // Envelope más suave
            gainNode.gain.setValueAtTime(0, now + (index * noteDuration));
            gainNode.gain.linearRampToValueAtTime(0.2, now + (index * noteDuration) + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + (index * noteDuration) + noteDuration);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start(now + (index * noteDuration));
            oscillator.stop(now + (index * noteDuration) + noteDuration);
        });
    }
}
