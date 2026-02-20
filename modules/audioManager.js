/**
 * modules/audioManager.js
 * Versión 2.2 – Seek bar sinusoidal animada en canvas
 */

export class AudioManager {
    constructor(uiManager) {
        this.ui = uiManager;

        this.bgMusic = document.getElementById("bgMusic");

        // Web Audio API para efectos de sonido
        this.audioContext = null;
        this.masterGain   = null;

        // Playlist con metadata completa
        this.playlist = [
            {
                src:    "assets/audio/playlist/Olivia Newton-John - Hopelessly Devoted to You.mp3",
                cover:  "assets/images/music-cover/hopelessly-devoted.jpg",
                title:  "Hopelessly Devoted to You",
                artist: "Olivia Newton-John"
            },
            {
                src:    "assets/audio/playlist/Morten Harket - Cant Take My Eyes off You.mp3",
                cover:  "assets/images/music-cover/cant-take-my-eyes.jpg",
                title:  "Can't Take My Eyes Off You",
                artist: "Morten Harket"
            },
            {
                src:    "assets/audio/playlist/Frank Sinatra - The World We Knew (Over and Over).mp3",
                cover:  "assets/images/music-cover/the-world-we-knew.jpg",
                title:  "The World We Knew",
                artist: "Frank Sinatra"
            },
            {
                src:    "assets/audio/playlist/Frank Sinatra - Strangers In The Night.mp3",
                cover:  "assets/images/music-cover/strangers-in-the-night.jpg",
                title:  "Strangers In The Night",
                artist: "Frank Sinatra"
            },
            {
                src:    "assets/audio/playlist/Frank Sinatra - My Way Of Life.mp3",
                cover:  "assets/images/music-cover/my-way-of-life.jpg",
                title:  "My Way Of Life",
                artist: "Frank Sinatra"
            }
        ];

        // Estado del reproductor
        this.currentTrackIndex = parseInt(localStorage.getItem("currentTrack") || "0");
        this.isShuffling       = localStorage.getItem("audioShuffle") === "true";
        this.isMuted           = localStorage.getItem("audioMuted")   === "true";
        this.volume            = parseFloat(localStorage.getItem("audioVolume") || "0.3");
        this.isPlaying         = false;
        this.isReady           = false;

        // Estado seek-bar canvas
        this._isSeeking      = false;       // true mientras el usuario arrastra
        this._seekPreview    = 0;           // progreso 0-1 durante drag
        this._phase          = 0;           // fase de la onda (px, se avanza cada frame)
        this._animating      = false;
        this._animFrameId    = null;
        this._lastFrameTime  = null;
        this._timeUpdateAcc  = 0;
        // dimensiones canvas en logical pixels (llenadas por _setupCanvas)
        this._cvW = 0;
        this._cvH = 0;
        this._dpr  = 1;

        // Estado interrupciones
        this.isBackgroundPaused = false;
        this.volumeBeforePause  = this.volume;

        this.init();
    }

    // ─────────────────────────────────────────────
    //  INICIALIZACIÓN
    // ─────────────────────────────────────────────

    init() {
        if (this.bgMusic) {
            this.bgMusic.volume = this.volume;
            this.bgMusic.muted  = this.isMuted;
            this.bgMusic.loop   = false;
            this.bgMusic.addEventListener("ended", () => this.nextTrack());
        }
        this.setupAutoplayTrigger();
    }

    setupAutoplayTrigger() {
        const startAudio = async () => {
            if (this.isReady) return;
            this.isReady = true;
            this.initAudioContext();
            if (this.audioContext && this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }
            this.startPlaylist();
        };
        document.addEventListener("touchend",  startAudio, { once: true, passive: true });
        document.addEventListener("mousedown", startAudio, { once: true });
    }

    initAudioContext() {
        if (this.audioContext) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain   = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 1.0;
        } catch (e) {
            console.warn("Web Audio API no disponible:", e);
        }
    }

    startPlaylist() {
        if (!this.bgMusic) return;
        this._loadAndPlay();
    }

    // ─────────────────────────────────────────────
    //  SEEK BAR — CANVAS WAVE ENGINE
    // ─────────────────────────────────────────────

    /** Arrancar el loop de animación rAF (llamado al abrir el modal) */
    startSeekBarUpdater() {
        this.stopSeekBarUpdater();
        this._animating     = true;
        this._lastFrameTime = null;
        this._timeUpdateAcc = 0;

        const canvas = document.getElementById("audioSeekCanvas");
        if (canvas) this._setupCanvas(canvas);

        const loop = (ts) => {
            if (!this._animating) return;

            const delta = this._lastFrameTime != null ? ts - this._lastFrameTime : 16;
            this._lastFrameTime = ts;

            // Avance de fase lineal: ~55 px/s → sin easing
            this._phase = (this._phase + delta * 0.055) % 100000;

            // Actualizar displays de tiempo cada 500 ms
            this._timeUpdateAcc += delta;
            if (this._timeUpdateAcc >= 500) {
                this._timeUpdateAcc = 0;
                this._updateTimeDisplay();
            }

            this._drawWave();
            this._animFrameId = requestAnimationFrame(loop);
        };

        this._animFrameId = requestAnimationFrame(loop);
    }

    /** Detener el loop */
    stopSeekBarUpdater() {
        this._animating = false;
        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
    }

    /**
     * Configurar canvas con DPR correcto.
     * Llamado cada vez que el modal se abre para garantizar
     * tamaño actualizado (rotación, resize).
     */
    _setupCanvas(canvas) {
        const container = canvas.parentElement || canvas;
        const rect = container.getBoundingClientRect();
        const dpr  = Math.min(window.devicePixelRatio || 1, 3);

        // Ancho lógico = ancho del contenedor; alto fijo = 40px
        const logW = Math.max(rect.width, 100);
        const logH = 40;

        canvas.width  = Math.round(logW * dpr);
        canvas.height = Math.round(logH * dpr);
        canvas.style.width  = logW + "px";
        canvas.style.height = logH + "px";

        this._cvW = logW;
        this._cvH = logH;
        this._dpr  = dpr;
    }

    /** Progreso 0-1 de la pista actual */
    _getProgress() {
        if (!this.bgMusic || !this.bgMusic.duration) return 0;
        return Math.min(1, this.bgMusic.currentTime / this.bgMusic.duration);
    }

    /**
     * Dibuja un fotograma completo:
     *   – onda inactiva (parte no reproducida, color tenue)
     *   – onda activa  (parte reproducida, color+glow)
     *   – fade de opacidad en los bordes laterales
     */
    _drawWave() {
        const canvas = document.getElementById("audioSeekCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const dpr = this._dpr;
        const W   = this._cvW;
        const H   = this._cvH;

        // Resetear transformación y limpiar
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const progress  = this._isSeeking ? this._seekPreview : this._getProgress();
        const progressX = W * progress;

        // Parámetros de la onda
        const amplitude  = 8;    // px – amplitud media
        const wavelength = 52;   // px – longitud de onda
        const centerY    = H / 2;
        const strokeW    = 5.5;  // trazo redondeado
        const fadeEdge   = 24;   // px – zona de fundido en cada borde

        // ── Precalcular path completo de la onda (tile continuo) ─────────────
        // Se usa una única función seno con desfase de fase para el tiling.
        // Math.sin ya es periódico, así que nunca hay saltos.
        const buildPath = () => {
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const angle = ((x + this._phase) / wavelength) * Math.PI * 2;
                // Interpolación cúbica suavizada: sustitución de la onda pura
                // por una combinación seno+armónico para mayor suavidad visual.
                const y = centerY
                    + amplitude * Math.sin(angle)
                    + (amplitude * 0.18) * Math.sin(angle * 2 + 0.9);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
        };

        ctx.lineCap  = "round";
        ctx.lineJoin = "round";

        // ── 1. Onda INACTIVA (zona no reproducida) ───────────────────────────
        ctx.save();
        ctx.beginPath();
        ctx.rect(progressX, 0, W - progressX, H);
        ctx.clip();

        buildPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth   = strokeW;
        ctx.stroke();
        ctx.restore();

        // ── 2. Onda ACTIVA con glow (zona ya reproducida) ────────────────────
        if (progressX > 0.5) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, progressX, H);
            ctx.clip();

            // Pasada de glow exterior difuso (blur grande, baja opacidad)
            buildPath();
            ctx.shadowColor = "rgba(255, 122, 168, 0.55)";
            ctx.shadowBlur  = 11;
            ctx.strokeStyle = "#ff7aa8";
            ctx.lineWidth   = strokeW + 1;
            ctx.stroke();

            // Pasada del trazo principal (blur menor, más brillante)
            ctx.shadowColor = "rgba(255, 160, 200, 0.8)";
            ctx.shadowBlur  = 5;
            ctx.strokeStyle = "#ffaed0";
            ctx.lineWidth   = strokeW - 1;
            ctx.stroke();

            ctx.restore();
        }

        // ── 3. Fundido de bordes con destination-out ─────────────────────────
        ctx.globalCompositeOperation = "destination-out";

        // Borde izquierdo
        const gLeft = ctx.createLinearGradient(0, 0, fadeEdge, 0);
        gLeft.addColorStop(0,   "rgba(0,0,0,1)");
        gLeft.addColorStop(0.6, "rgba(0,0,0,0.4)");
        gLeft.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = gLeft;
        ctx.fillRect(0, 0, fadeEdge, H);

        // Borde derecho
        const gRight = ctx.createLinearGradient(W - fadeEdge, 0, W, 0);
        gRight.addColorStop(0,   "rgba(0,0,0,0)");
        gRight.addColorStop(0.4, "rgba(0,0,0,0.4)");
        gRight.addColorStop(1,   "rgba(0,0,0,1)");
        ctx.fillStyle = gRight;
        ctx.fillRect(W - fadeEdge, 0, fadeEdge, H);

        ctx.globalCompositeOperation = "source-over";
    }

    /** Actualizar solo los textos de tiempo */
    _updateTimeDisplay() {
        if (!this.bgMusic) return;
        const cur = this.bgMusic.currentTime || 0;
        const dur = this.bgMusic.duration    || 0;
        const elCur = document.getElementById("audioTimeCurrent");
        const elTot = document.getElementById("audioTimeTotal");
        if (elCur) elCur.textContent = this._formatTime(cur);
        if (elTot) elTot.textContent = this._formatTime(dur);
    }

    /** Saltar a posición. percent = 0-100 */
    seekTo(percent) {
        if (!this.bgMusic || !this.bgMusic.duration) return;
        this.bgMusic.currentTime = (percent / 100) * this.bgMusic.duration;
        this._updateTimeDisplay();
    }

    /** Previsualizacion durante drag. ratio = 0-1 */
    seekPreview(ratio) {
        this._seekPreview = Math.max(0, Math.min(1, ratio));
    }

    /** MM:SS */
    _formatTime(s) {
        if (!s || isNaN(s)) return "0:00";
        const m = Math.floor(s / 60);
        return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
    }

    // Compatibilidad: método vacío (ya no se usa range input)
    _updateSeekFill() {}
    _updateSeekBar()  {}

    // ─────────────────────────────────────────────
    //  CONTROLES DE REPRODUCCIÓN
    // ─────────────────────────────────────────────

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

    nextTrack() {
        this.currentTrackIndex = this.isShuffling
            ? Math.floor(Math.random() * this.playlist.length)
            : (this.currentTrackIndex + 1) % this.playlist.length;
        this._loadAndPlay();
    }

    prevTrack() {
        this.currentTrackIndex =
            (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this._loadAndPlay();
    }

    playTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            this._loadAndPlay();
        }
    }

    _loadAndPlay() {
        if (!this.bgMusic) return;
        const track = this.playlist[this.currentTrackIndex];
        this.bgMusic.src = track.src;
        localStorage.setItem("currentTrack", this.currentTrackIndex.toString());
        this.bgMusic.play()
            .then(() => { this.isPlaying = true; this.updateUI(); })
            .catch(e => console.warn("Play error:", e));
    }

    toggleShuffle() {
        this.isShuffling = !this.isShuffling;
        localStorage.setItem("audioShuffle", this.isShuffling.toString());
        this.ui.showToast(this.isShuffling ? "Aleatorio Activado" : "Orden Normal");
        this.updateUI();
    }

    toggleMute() {
        if (!this.bgMusic) return;
        this.isMuted = !this.isMuted;
        this.bgMusic.muted = this.isMuted;
        localStorage.setItem("audioMuted", this.isMuted.toString());
        this.ui.showToast(this.isMuted ? "Silenciado" : "Audio Activado");
        this.updateUI();
    }

    setVolume(value) {
        if (!this.bgMusic) return;
        this.volume = Math.max(0, Math.min(1, value));
        this.bgMusic.volume = this.volume;
        localStorage.setItem("audioVolume", this.volume.toString());
        this.updateUI();
    }

    // ─────────────────────────────────────────────
    //  INTERRUPCIONES (Smart Ducking)
    // ─────────────────────────────────────────────

    pauseBackground() {
        if (!this.bgMusic || this.isBackgroundPaused) return;
        this.isBackgroundPaused = true;
        this.volumeBeforePause  = this.bgMusic.volume;
        this._fadeVolume(this.bgMusic.volume, 0, 500, () => this.bgMusic.pause());
    }

    resumeBackground() {
        if (!this.bgMusic || !this.isBackgroundPaused) return;
        this.isBackgroundPaused = false;
        this.bgMusic.volume = 0;
        this.bgMusic.play()
            .then(() => this._fadeVolume(0, this.volumeBeforePause, 1500))
            .catch(e => console.warn("Resume error:", e));
    }

    _fadeVolume(from, to, duration, callback) {
        if (!this.bgMusic) return;
        const steps    = 20;
        const stepMs   = duration / steps;
        const stepVol  = (to - from) / steps;
        let   n        = 0;
        const id = setInterval(() => {
            n++;
            this.bgMusic.volume = Math.max(0, Math.min(1, from + stepVol * n));
            if (n >= steps) {
                clearInterval(id);
                this.bgMusic.volume = to;
                if (callback) callback();
            }
        }, stepMs);
    }

    // ─────────────────────────────────────────────
    //  UI
    // ─────────────────────────────────────────────

    getCurrentTrack() {
        return this.playlist[this.currentTrackIndex];
    }

    updateUI() {
        if (this.ui.updateAudioModal) {
            this.ui.updateAudioModal({
                isPlaying:         this.isPlaying,
                isMuted:           this.isMuted,
                isShuffling:       this.isShuffling,
                volume:            this.volume,
                currentTrackIndex: this.currentTrackIndex,
                playlist:          this.playlist
            });
        }
        this._updateTimeDisplay();
    }

    // ─────────────────────────────────────────────
    //  EFECTOS DE SONIDO (Web Audio API)
    // ─────────────────────────────────────────────

    playCorrect() {
        if (!this.audioContext) this.initAudioContext();
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        [261.63, 329.63, 392.00].forEach((freq, i) => {
            const osc  = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.13);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.13 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.13 + 0.13);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.13);
            osc.stop(now + i * 0.13 + 0.13);
        });
    }

    playIncorrect() {
        if (!this.audioContext) this.initAudioContext();
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        [220.00, 174.61].forEach((freq, i) => {
            const osc    = this.audioContext.createOscillator();
            const gain   = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            osc.type = "sawtooth";
            osc.frequency.value = freq;
            filter.type = "lowpass";
            filter.frequency.value = 800;
            filter.Q.value = 1;
            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.15);
        });
    }
}
