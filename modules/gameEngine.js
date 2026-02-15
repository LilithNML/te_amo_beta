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
        this.MAX_FAILED_ATTEMPTS = 3; // Reducido a 3 para activar la luna más rápido
        
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
        this.checkMoonHintVisibility();
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
        // ACTUALIZADO: Buscamos "checkBtn" que es el ID que pusimos en el HTML nuevo
        const btn = document.getElementById("checkBtn");
        const input = document.getElementById("codeInput");
        const resetBtn = document.getElementById("menuReset");
        const hintBtn = document.getElementById("hintBtn"); // Nuevo botón de pista

        if (btn) btn.addEventListener("click", () => this.handleInput());
        if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this.handleInput(); } });
        if (resetBtn) resetBtn.addEventListener("click", () => this.resetProgress());
        
        // Listener para el botón de pista
        if (hintBtn) {
            hintBtn.addEventListener("click", () => this.giveHint());
        }
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
             this.checkMoonHintVisibility(); // Verificar si mostrar la luna
             return;
        }

        if (this.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
            this.showMoonHint(); // Mostrar la luna mágica
        } else {
            this.ui.renderMessage("Código Incorrecto", `Intento ${this.failedAttempts} de ${this.MAX_FAILED_ATTEMPTS} para recibir una ayuda.`);
        }
        
        this.checkMoonHintVisibility(); // Verificar si mostrar la luna
    }

    // Verificar si mostrar el icono de la luna
    checkMoonHintVisibility() {
        const moonHint = document.getElementById('moonHint');
        if (!moonHint) return;
        
        if (this.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
            moonHint.hidden = false;
            // Agregar listener si no existe
            if (!moonHint.onclick) {
                moonHint.onclick = () => this.giveSmartHint();
            }
        } else {
            moonHint.hidden = true;
        }
    }

    // Mostrar luna de pista
    showMoonHint() {
        const moonHint = document.getElementById('moonHint');
        if (moonHint) {
            moonHint.hidden = false;
            // Agregar listener si no existe
            if (!moonHint.onclick) {
                moonHint.onclick = () => this.giveSmartHint();
            }
        }
    }

    // Ocultar luna de pista
    hideMoonHint() {
        const moonHint = document.getElementById('moonHint');
        if (moonHint) {
            moonHint.hidden = true;
        }
    }

    // Pista inteligente basada en levenshtein
    giveSmartHint() {
        const input = this.ui.elements.input;
        const inputValue = input ? input.value.trim() : "";
        
        if (!inputValue || inputValue === "") {
            this.giveHint(); // Si no hay input, dar pista normal
            return;
        }
        
        const normalizedInput = normalizeText(inputValue);
        const allCodes = Object.keys(this.mensajes);
        const lockedCodes = allCodes.filter(code => !this.unlocked.has(code));
        
        if (lockedCodes.length === 0) {
            this.ui.showToast("🎉 ¡Ya has descubierto todos los secretos!");
            this.ui.triggerConfetti();
            this.hideMoonHint();
            return;
        }
        
        // Buscar código más cercano usando levenshtein
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
        
        const data = this.mensajes[closest];
        let message = "";
        
        if (minDist <= 2) {
            // Pista "caliente" - muy cerca
            message = `🌕 La luna te susurra: <strong>Estás muy cerca...</strong><br><br>${data.pista || 'Sigue intentando, casi lo logras.'}`;
        } else {
            // Pista general
            message = `🌕 La luna te guía:<br><br>${data.pista || 'Sigue buscando... este secreto es muy misterioso.'}`;
        }
        
        this.ui.renderMessage("💡 Mensaje de la Luna", message);
    }

    /**
     * Busca un código bloqueado al azar y muestra su pista.
     * Unificado para funcionar tanto con el botón como automáticamente.
     */
    giveHint() {
        // Obtener todos los códigos
        const allCodes = Object.keys(this.mensajes);
        
        // Filtrar solo los que NO han sido descubiertos
        const lockedCodes = allCodes.filter(code => !this.unlocked.has(code));

        if (lockedCodes.length === 0) {
            this.ui.showToast("🎉 ¡Eres increíble! Ya has descubierto todos los secretos.");
            this.ui.triggerConfetti();
            return;
        }

        // Elegir uno al azar
        const randomCode = lockedCodes[Math.floor(Math.random() * lockedCodes.length)];
        const data = this.mensajes[randomCode];

        // Obtener la pista o mensaje por defecto
        const pistaTexto = data.pista && data.pista.trim() !== "" 
            ? data.pista 
            : "Sigue buscando... este secreto es muy misterioso.";

        // Mostrar la pista
        // Usamos renderMessage para que se vea claro en un modal/alerta bonito
        this.ui.renderMessage("💡 Pista Disponible", pistaTexto);
        
        // Efecto visual en el input (sin abrir teclado)
        const input = this.ui.elements.input;
        if(input) {
            input.classList.add("shake");
            setTimeout(() => input.classList.remove("shake"), 500);
        }
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
        this.hideMoonHint(); // Ocultar la luna al acertar
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
        this.hideMoonHint(); // Ocultar la luna al resetear
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
}
