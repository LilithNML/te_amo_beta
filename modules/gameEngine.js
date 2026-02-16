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
        
        // Sistema de resonancia
        this.resonanceMode = false;
        this.resonanceTarget = null;
        
        this.init();
    }

    init() {
        this.updateProgress();
        this.setupEventListeners();
        this.ui.onToggleFavorite = (code) => this.toggleFavorite(code);
        this.ui.onCodeSelected = (code) => this.unlockCode(code, false);
        this.ui.onImportData = (data) => this.importProgress(data);
        this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
        this.updateAchievementsModal();
    }

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
        const hintBtn = document.getElementById("hintBtn");

        if (btn) btn.addEventListener("click", () => this.handleInput());
        if (input) {
            input.addEventListener("keydown", (e) => { 
                if (e.key === "Enter") { 
                    e.preventDefault(); 
                    this.handleInput(); 
                } 
            });
            
            // Modo Resonancia - monitorear input en tiempo real
            input.addEventListener("input", () => this.handleResonanceInput());
        }
        if (resetBtn) resetBtn.addEventListener("click", () => this.resetProgress());
        if (hintBtn) hintBtn.addEventListener("click", () => this.handleHintRequest());
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

        // Buscar código más cercano
        let closest = null, minDist = 3;
        for (const key of Object.keys(this.mensajes)) {
            const normalizedKey = normalizeText(key);
            const dist = levenshtein(normalizedInput, normalizedKey);
            if (dist < minDist || normalizedKey.includes(normalizedInput)) { 
                closest = key; 
                minDist = dist; 
            }
        }

        if (closest) {
             this.ui.renderMessage("Vas muy bien...", `Parece que intentas escribir <strong>"${closest}"</strong>. ¡Revisa!`);
             return;
        }

        // Activar modo resonancia si tiene 5+ fallos
        if (this.failedAttempts >= 5 && !this.resonanceMode) {
            this.activateResonanceMode();
        }

        this.ui.renderMessage("Código Incorrecto", `Intento ${this.failedAttempts}. ${this.failedAttempts >= 3 ? '💡 Usa el botón de pista para ayuda.' : ''}`);
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
        this.updateAchievementsModal();
        this.deactivateResonanceMode(); // Desactivar resonancia al acertar
    }

    toggleFavorite(code) { 
        if (this.favorites.has(code)) this.favorites.delete(code); 
        else this.favorites.add(code); 
        localStorage.setItem("favoritos", JSON.stringify([...this.favorites])); 
        this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
        this.updateAchievementsModal();
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
        this.deactivateResonanceMode(); // Desactivar resonancia al resetear
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
    // SISTEMA DE PISTAS PROGRESIVAS
    // ===========================================

    // Obtener el código bloqueado más cercano a lo que escribió
    getClosestLockedCode(currentInput) {
        const allCodes = Object.keys(this.mensajes);
        const lockedCodes = allCodes.filter(code => !this.unlocked.has(code));
        
        if (lockedCodes.length === 0) return null;
        
        let closest = lockedCodes[0];
        let minDist = Infinity;
        
        for (const code of lockedCodes) {
            const normalizedCode = normalizeText(code);
            const dist = levenshtein(currentInput, normalizedCode);
            if (dist < minDist) {
                minDist = dist;
                closest = code;
            }
        }
        
        return closest;
    }

    // Manejar solicitud de pista (click en bombilla)
    handleHintRequest() {
        const input = this.ui.elements.input;
        const currentInput = normalizeText(input.value);
        
        // Si no ha escrito nada, dar pista general
        if (!currentInput) {
            this.ui.showToast("¡Escribe algo para que pueda darte una pista más clara! ✨");
            return;
        }

        // Buscar el código más parecido
        const closestCode = this.getClosestLockedCode(currentInput);
        
        if (!closestCode) {
            this.ui.showToast("🎉 ¡Ya has descubierto todos los secretos!");
            this.ui.triggerConfetti();
            return;
        }

        const dataSecreta = this.mensajes[closestCode];
        const pistaOriginal = dataSecreta && dataSecreta.pista 
            ? dataSecreta.pista 
            : "Es un secreto muy especial...";

        // Nivel 1 (0-2 fallos): Pista original
        if (this.failedAttempts < 3) {
            this.ui.renderMessage("💡 Pista", pistaOriginal);
        } 
        // Nivel 2 (3-4 fallos): Pista + estructura
        else if (this.failedAttempts < 5) {
            const info = `${pistaOriginal}<br><br><strong>Estructura:</strong> Son ${closestCode.length} caracteres y empieza por '${closestCode[0].toUpperCase()}'`;
            this.ui.renderMessage("💡 Pista Mejorada", info);
        } 
        // Nivel 3 (5+ fallos): Activar modo resonancia
        else {
            this.ui.showToast("🔥 ¡Modo Radar activado! Mira el color del cuadro mientras escribes...");
            this.activateResonanceMode();
            
            setTimeout(() => {
                this.ui.renderMessage("💡 Pista Completa", `${pistaOriginal}<br><br><strong>Estructura:</strong> ${closestCode.length} caracteres, comienza por '${closestCode[0].toUpperCase()}' y termina en '${closestCode[closestCode.length - 1].toUpperCase()}'`);
            }, 500);
        }
    }

    // Activar modo resonancia
    activateResonanceMode() {
        if (this.resonanceMode) return;
        
        this.resonanceMode = true;
        const input = this.ui.elements.input;
        if (input) {
            input.classList.add('hint-appear');
            setTimeout(() => input.classList.remove('hint-appear'), 400);
        }
    }

    // Desactivar modo resonancia
    deactivateResonanceMode() {
        this.resonanceMode = false;
        this.resonanceTarget = null;
        const input = this.ui.elements.input;
        if (input) {
            input.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot');
        }
    }

    // Manejar input en modo resonancia (tiempo real)
    handleResonanceInput() {
        if (!this.resonanceMode) return;
        
        const input = this.ui.elements.input;
        if (!input) return;
        
        const currentInput = normalizeText(input.value.trim());
        if (!currentInput) {
            input.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot');
            return;
        }

        // Calcular distancia al código más cercano
        const closestCode = this.getClosestLockedCode(currentInput);
        if (!closestCode) return;

        const dist = levenshtein(currentInput, normalizeText(closestCode));
        
        // Mapear distancia a clase de color
        input.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot');
        
        if (dist > 4) {
            input.classList.add('resonance-cold'); // Azul - Frío
        } else if (dist >= 2) {
            input.classList.add('resonance-warm'); // Amarillo - Tibio
        } else {
            input.classList.add('resonance-hot'); // Rojo - ¡Quemándote!
        }
    }
}
