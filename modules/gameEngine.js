/**
 * modules/gameEngine.js
 * Actualizado con Botón de Pistas y correcciones de ID
 */

import { normalizeText, levenshtein } from './utils.js';

export class GameEngine {
    constructor(uiManager, audioManager, mensajes, logros) {
    this.ui = uiManager;
    this.audio = audioManager;
    this.mensajes = mensajes; 
    this.logros = logros;

        this.unlocked = new Set(JSON.parse(localStorage.getItem("desbloqueados") || "[]"));
        this.favorites = new Set(JSON.parse(localStorage.getItem("favoritos") || "[]"));
        this.achievedLogros = new Set(JSON.parse(localStorage.getItem("logrosAlcanzados") || "[]"));
        this.failedAttempts = parseInt(localStorage.getItem("failedAttempts") || "0");
        
        // Sistema de luna evolutiva
        this.moonPhase = 0; // 0: oculta, 1: creciente (3), 2: cuarto (5), 3: llena (7+)
        this.moonPressTimer = null;
        this.moonPressProgress = 0;
        this.resonanceMode = false;
        
        this.init();
    }

    init() {
        this.updateProgress();
        this.setupEventListeners();
        this.ui.onToggleFavorite = (code) => this.toggleFavorite(code);
        this.ui.onCodeSelected = (code) => this.unlockCode(code, false);
        this.ui.onImportData = (data) => this.importProgress(data);
        this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
        // Actualizar modal de logros
        this.updateAchievementsModal();
        // Verificar si mostrar la luna desde el inicio
        this.checkMoonVisibility();
        // Configurar sistema de luna
        this.setupMoonSystem();
    }

    // Actualizar modal de logros
    updateAchievementsModal() {
        this.ui.updateAchievementsModal(
            this.unlocked, 
            this.favorites, 
            this.mensajes, 
            this.logros, 
            this.achievedLogros
        );
    }

    setupEventListeners() {
        const btn = document.getElementById("checkBtn");
        const input = document.getElementById("codeInput");
        const resetBtn = document.getElementById("menuReset");

        if (btn) btn.addEventListener("click", () => this.handleInput());
        if (input) {
            input.addEventListener("keydown", (e) => { 
                if (e.key === "Enter") { 
                    e.preventDefault(); 
                    this.handleInput(); 
                } 
            });
            
            // Modo Resonancia - monitorear input en tiempo real
            input.addEventListener("input", () => this.handleResonanceMode());
        }
        if (resetBtn) resetBtn.addEventListener("click", () => this.resetProgress());
    }

    handleInput() {
        const inputRaw = this.ui.elements.input.value;
        if (!inputRaw || inputRaw.trim() === "") return;
        this.ui.dismissKeyboard();
        const normalizedInput = normalizeText(inputRaw);
        let foundKey = Object.keys(this.mensajes).find(k => normalizeText(k) === normalizedInput);

        if (foundKey) {
            this.unlockCode(foundKey, true);
            this.resetFailedAttempts();
        } else {
            this.handleIncorrectInput(normalizedInput);
        }
    }

    handleIncorrectInput(normalizedInput) {
        this.audio.playIncorrect();
        this.ui.showError();
        
        // Feedback háptico visual - shake animation
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            inputContainer.classList.add('error-shake');
            setTimeout(() => inputContainer.classList.remove('error-shake'), 400);
        }
        
        // Vibración en dispositivos compatibles
        if (navigator.vibrate) navigator.vibrate(200);

        this.failedAttempts++;
        localStorage.setItem("failedAttempts", this.failedAttempts.toString());

        let closest = null, minDist = 3;
        for (const key of Object.keys(this.mensajes)) {
            const normalizedKey = normalizeText(key);
            const dist = levenshtein(normalizedInput, normalizedKey);
            if (dist < minDist || normalizedKey.includes(normalizedInput)) { closest = key; minDist = dist; }
        }

        if (closest) {
             this.ui.renderMessage("Vas muy bien...", `Parece que intentas escribir <strong>"${closest}"</strong>. ¡Revisa!`);
             this.checkMoonVisibility(); // Verificar fase de la luna
             return;
        }

        // Mostrar mensaje según fase de luna
        let message = "Código Incorrecto.";
        if (this.failedAttempts >= 7) {
            message = "Código Incorrecto. La Luna Llena brilla para guiarte...";
        } else if (this.failedAttempts >= 5) {
            message = "Código Incorrecto. El Cuarto Creciente se ilumina...";
        } else if (this.failedAttempts >= 3) {
            message = "Código Incorrecto. La Luna Creciente aparece...";
        } else {
            message = `Código Incorrecto. Intento ${this.failedAttempts} de 3.`;
        }
        
        this.ui.renderMessage("❌ Intento fallido", message);
        this.checkMoonVisibility(); // Verificar fase de la luna
    }

    unlockCode(key, isNewDiscovery) {
        const data = this.mensajes[key];
        
        if (isNewDiscovery) {
            this.ui.showSuccess();
            this.audio.playCorrect();
            if (navigator.vibrate) navigator.vibrate(200);
            this.ui.triggerConfetti();

            if (!this.unlocked.has(key)) {
                this.unlocked.add(key);
                this.saveProgress();
                this.checkLogros();
                this.ui.showToast(`¡Nuevo descubrimiento: ${key}!`);
            }
        }

        this.ui.renderContent(data, key);
        this.ui.clearInput();
        this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
        this.updateAchievementsModal(); // Actualizar modal de logros
        this.hideMoon(); // Ocultar la luna al acertar
    }

    toggleFavorite(code) { 
        if (this.favorites.has(code)) this.favorites.delete(code); 
        else this.favorites.add(code); 
        localStorage.setItem("favoritos", JSON.stringify([...this.favorites])); 
        this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
        this.updateAchievementsModal(); // Actualizar modal de logros
    }
    
    checkLogros() { 
        const c = this.unlocked.size; 
        this.logros.forEach(l => { 
            if (!this.achievedLogros.has(l.id) && c >= l.codigo_requerido) { 
                this.achievedLogros.add(l.id); 
                this.ui.showToast(`Logro: ${l.mensaje}`); 
                localStorage.setItem("logrosAlcanzados", JSON.stringify([...this.achievedLogros])); 
            } 
        }); 
    }
    
    updateProgress() { this.ui.updateProgress(this.unlocked.size, Object.keys(this.mensajes).length); }
    saveProgress() { localStorage.setItem("desbloqueados", JSON.stringify([...this.unlocked])); this.updateProgress(); }
    resetFailedAttempts() { 
        this.failedAttempts = 0; 
        localStorage.setItem("failedAttempts", "0"); 
        this.hideMoon(); // Ocultar la luna al resetear
    }
    
    importProgress(data) { 
        if (!data.unlocked || !Array.isArray(data.unlocked)) { 
            this.ui.showToast("Error: Archivo incompatible"); return; 
        } 
        
        // Importar códigos, favoritos y logros
        this.unlocked = new Set(data.unlocked); 
        this.favorites = new Set(data.favorites || []); 
        this.achievedLogros = new Set(data.achievements || []); 
        
        // Guardar datos básicos en localStorage
        localStorage.setItem("desbloqueados", JSON.stringify([...this.unlocked]));
        localStorage.setItem("favoritos", JSON.stringify([...this.favorites]));
        localStorage.setItem("logrosAlcanzados", JSON.stringify([...this.achievedLogros]));
        
        // Importar métricas si existen (Backup 2.0)
        if (data.metrics) {
            localStorage.setItem("totalTime", data.metrics.totalTime?.toString() || "0");
            localStorage.setItem("currentStreak", data.metrics.currentStreak?.toString() || "0");
            localStorage.setItem("longestStreak", data.metrics.longestStreak?.toString() || "0");
            if (data.metrics.firstVisit) localStorage.setItem("firstVisit", data.metrics.firstVisit);
            if (data.metrics.lastVisit) localStorage.setItem("lastVisit", data.metrics.lastVisit);
        }
        
        // Importar fecha del oráculo si existe (prevenir trampa)
        if (data.oracle && data.oracle.lastOracleDate) {
            localStorage.setItem("lastOracleDate", data.oracle.lastOracleDate);
        }
        
        this.saveProgress(); 
        this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
        this.updateAchievementsModal(); // Actualizar modal de logros
        
        // Recargar estadísticas en UI
        this.ui.statsData = this.ui.loadStatsData();
        
        this.ui.showToast("✨ ¡Progreso completo restaurado!"); 
    }
    
    resetProgress() { if (confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); } }

    // ===========================================
    // SISTEMA DE LUNA EVOLUTIVA
    // ===========================================

    setupMoonSystem() {
        const moonHint = document.getElementById('moonHint');
        if (!moonHint) return;

        let pressStartTime = null;
        const PRESS_DURATION = 2500; // 2.5 segundos

        // Detectar inicio de presión (mouse y touch)
        const startPress = (e) => {
            e.preventDefault();
            if (this.moonPhase === 0) return;

            pressStartTime = Date.now();
            moonHint.classList.add('pressing');
            
            // Animar progreso
            this.animateMoonPress(moonHint, PRESS_DURATION);
        };

        // Detectar fin de presión
        const endPress = (e) => {
            e.preventDefault();
            if (!pressStartTime) return;

            const pressDuration = Date.now() - pressStartTime;
            moonHint.classList.remove('pressing');
            
            if (pressDuration >= PRESS_DURATION) {
                // Presión completada - mostrar pista
                this.activateMoonHint();
            } else {
                // Presión incompleta - resetear
                this.resetMoonPress(moonHint);
            }
            
            pressStartTime = null;
        };

        // Event listeners para mouse y touch
        moonHint.addEventListener('mousedown', startPress);
        moonHint.addEventListener('mouseup', endPress);
        moonHint.addEventListener('mouseleave', endPress);
        
        moonHint.addEventListener('touchstart', startPress);
        moonHint.addEventListener('touchend', endPress);
        moonHint.addEventListener('touchcancel', endPress);
    }

    animateMoonPress(moonHint, duration) {
        const progressBar = moonHint.querySelector('.moon-press-progress');
        if (!progressBar) return;

        let start = null;
        
        const animate = (timestamp) => {
            if (!moonHint.classList.contains('pressing')) {
                progressBar.style.background = 'conic-gradient(rgba(255, 215, 0, 0.8) 0deg, transparent 0deg)';
                return;
            }

            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min((elapsed / duration) * 360, 360);
            
            progressBar.style.background = `conic-gradient(
                rgba(255, 215, 0, 0.8) ${progress}deg,
                transparent ${progress}deg
            )`;

            if (elapsed < duration && moonHint.classList.contains('pressing')) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    resetMoonPress(moonHint) {
        const progressBar = moonHint.querySelector('.moon-press-progress');
        if (progressBar) {
            progressBar.style.background = 'conic-gradient(rgba(255, 215, 0, 0.8) 0deg, transparent 0deg)';
        }
    }

    activateMoonHint() {
        const moonHint = document.getElementById('moonHint');
        if (!moonHint) return;

        // Flash blanco
        const flash = document.createElement('div');
        flash.className = 'moon-flash-effect';
        moonHint.appendChild(flash);
        setTimeout(() => flash.remove(), 500);

        // Mostrar pista según fase
        this.showPredictiveHint();
    }

    checkMoonVisibility() {
        const moonHint = document.getElementById('moonHint');
        if (!moonHint) return;

        // Determinar fase según fallos
        if (this.failedAttempts >= 7) {
            this.moonPhase = 3; // Luna Llena
            this.resonanceMode = true;
        } else if (this.failedAttempts >= 5) {
            this.moonPhase = 2; // Cuarto Creciente
        } else if (this.failedAttempts >= 3) {
            this.moonPhase = 1; // Luna Creciente
        } else {
            this.moonPhase = 0;
        }

        // Actualizar visualización
        if (this.moonPhase > 0) {
            moonHint.hidden = false;
            moonHint.setAttribute('data-phase', this.moonPhase.toString());
        } else {
            moonHint.hidden = true;
            this.resonanceMode = false;
        }
    }

    hideMoon() {
        const moonHint = document.getElementById('moonHint');
        if (moonHint) {
            moonHint.hidden = true;
            this.moonPhase = 0;
            this.resonanceMode = false;
            moonHint.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot', 'resonance-perfect');
        }
    }

    showPredictiveHint() {
        const input = this.ui.elements.input;
        const inputValue = input ? input.value.trim() : "";
        
        if (!inputValue || inputValue === "") {
            this.giveGeneralHint();
            return;
        }
        
        const normalizedInput = normalizeText(inputValue);
        const allCodes = Object.keys(this.mensajes);
        const lockedCodes = allCodes.filter(code => !this.unlocked.has(code));
        
        if (lockedCodes.length === 0) {
            this.ui.showToast("🎉 ¡Ya has descubierto todos los secretos!");
            this.ui.triggerConfetti();
            this.hideMoon();
            return;
        }
        
        // Buscar código más cercano
        let closest = null;
        let minDist = Infinity;
        
        for (const code of lockedCodes) {
            const normalizedCode = normalizeText(code);
            const dist = levenshtein(normalizedInput, normalizedCode);
            if (dist < minDist) {
                minDist = dist;
                closest = code;
            }
        }
        
        // Mensajes predictivos según distancia
        let message = "";
        const codeLength = closest.length;
        
        if (minDist === 1) {
            // CASI ACIERTA - un solo carácter de diferencia
            message = `🌕 La luna tiembla...<br><br><strong>Estás a un solo suspiro de la verdad.</strong><br>Revisa esa letra.`;
        } else if (this.isReversed(normalizedInput, normalizeText(closest))) {
            // CÓDIGO INVERTIDO
            message = `🌕 La luna susurra:<br><br><strong>El tiempo fluye al revés en tu mente, pero el secreto es el mismo.</strong><br>Intenta invertir tu respuesta.`;
        } else if (minDist <= 2) {
            // MUY CERCA
            const data = this.mensajes[closest];
            message = `🌕 La luna te guía:<br><br><strong>Estás muy cerca...</strong><br><br>${data.pista || 'Casi lo logras, sigue intentando.'}`;
        } else {
            // Fase 1: Longitud del código
            if (this.moonPhase === 1) {
                message = `🌙 La luna creciente susurra:<br><br><strong>El secreto tiene ${codeLength} destellos</strong> (letras/números).`;
            }
            // Fase 2: Primera y última letra
            else if (this.moonPhase === 2) {
                const firstChar = closest[0];
                const lastChar = closest[closest.length - 1];
                message = `🌓 El cuarto creciente revela:<br><br><strong>Comienza con "${firstChar}" y termina con "${lastChar}"</strong>`;
            }
            // Fase 3: Pista completa
            else {
                const data = this.mensajes[closest];
                message = `🌕 La luna llena revela:<br><br>${data.pista || 'Sigue buscando... estás en el camino correcto.'}`;
            }
        }
        
        this.ui.renderMessage("💫 Mensaje de la Luna", message);
    }

    giveGeneralHint() {
        const allCodes = Object.keys(this.mensajes);
        const lockedCodes = allCodes.filter(code => !this.unlocked.has(code));
        
        if (lockedCodes.length === 0) {
            this.ui.showToast("🎉 ¡Ya has descubierto todos los secretos!");
            this.ui.triggerConfetti();
            this.hideMoon();
            return;
        }
        
        const randomCode = lockedCodes[Math.floor(Math.random() * lockedCodes.length)];
        const data = this.mensajes[randomCode];
        const codeLength = randomCode.length;
        
        let message = "";
        
        if (this.moonPhase === 1) {
            message = `🌙 La luna creciente susurra:<br><br><strong>Busca un secreto de ${codeLength} destellos.</strong>`;
        } else if (this.moonPhase === 2) {
            message = `🌓 El cuarto creciente revela:<br><br>${data.pista || 'Sigue buscando...'}`;
        } else {
            message = `🌕 La luna llena te guía:<br><br>${data.pista || 'El secreto está cerca... sigue buscando.'}`;
        }
        
        this.ui.renderMessage("💫 Mensaje de la Luna", message);
    }

    isReversed(str1, str2) {
        return str1 === str2.split('').reverse().join('');
    }

    // Modo Resonancia - feedback en tiempo real
    handleResonanceMode() {
        if (!this.resonanceMode) return;
        
        const moonHint = document.getElementById('moonHint');
        const input = this.ui.elements.input;
        
        if (!moonHint || !input) return;
        
        const inputValue = normalizeText(input.value.trim());
        if (!inputValue) {
            moonHint.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot', 'resonance-perfect');
            return;
        }
        
        // Calcular distancia al código más cercano
        const allCodes = Object.keys(this.mensajes);
        const lockedCodes = allCodes.filter(code => !this.unlocked.has(code));
        
        let minDist = Infinity;
        for (const code of lockedCodes) {
            const dist = levenshtein(inputValue, normalizeText(code));
            if (dist < minDist) {
                minDist = dist;
            }
        }
        
        // Mapear distancia a clase de color
        moonHint.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot', 'resonance-perfect');
        
        if (minDist === 0) {
            moonHint.classList.add('resonance-perfect'); // Blanco brillante - ¡Es aquí!
        } else if (minDist <= 2) {
            moonHint.classList.add('resonance-hot'); // Dorado - Cerca
        } else if (minDist <= 5) {
            moonHint.classList.add('resonance-warm'); // Naranja - Tibio
        } else {
            moonHint.classList.add('resonance-cold'); // Rojo - Lejos
        }
    }
}
