/**
 * modules/gameEngine.js
 *
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
        
        // Reanudar música de fondo si estaba pausada por multimedia anterior
        if (window.audioManager && window.audioManager.isBackgroundPaused) {
            window.audioManager.resumeBackground();
        }
        
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
        // Validación estricta del formato
        if (!data || typeof data !== 'object') {
            this.ui.showToast("❌ Error: Archivo inválido"); 
            return; 
        }
        
        if (!data.unlocked || !Array.isArray(data.unlocked)) { 
            this.ui.showToast("❌ Error: Archivo incompatible con esta aplicación"); 
            return; 
        }
        
        // Efecto visual de reinicio (fade out/in)
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            // Importar códigos, favoritos y logros
            this.unlocked = new Set(data.unlocked); 
            this.favorites = new Set(data.favorites || []); 
            this.achievedLogros = new Set(data.achievements || []); 
            
            // Guardar datos básicos en localStorage
            localStorage.setItem("desbloqueados", JSON.stringify([...this.unlocked]));
            localStorage.setItem("favoritos", JSON.stringify([...this.favorites]));
            localStorage.setItem("logrosAlcanzados", JSON.stringify([...this.achievedLogros]));
            
            // Importar correos leídos si existen (Backup 2.3+)
            if (data.readEmails && Array.isArray(data.readEmails)) {
                localStorage.setItem("readEmails", JSON.stringify(data.readEmails));
                // Actualizar en UIManager si está disponible
                if (this.ui.readEmails) {
                    this.ui.readEmails = new Set(data.readEmails);
                    this.ui.checkMailboxNotifications();
                }
            }
            
            // Importar stats si existen (Backup 2.0)
            if (data.stats) {
                localStorage.setItem("totalTime", (data.stats.totalTime || 0).toString());
                localStorage.setItem("currentStreak", (data.stats.currentStreak || 0).toString());
                localStorage.setItem("longestStreak", (data.stats.longestStreak || 0).toString());
                if (data.stats.firstVisit) localStorage.setItem("firstVisit", data.stats.firstVisit);
                if (data.stats.lastVisit) localStorage.setItem("lastVisit", data.stats.lastVisit);
                if (data.stats.failedAttempts !== undefined) {
                    this.failedAttempts = data.stats.failedAttempts;
                    localStorage.setItem("failedAttempts", data.stats.failedAttempts.toString());
                }
            }
            
            // Importar oráculo si existe
            if (data.oracle) {
                if (data.oracle.lastOracleDate) {
                    localStorage.setItem("lastOracleDate", data.oracle.lastOracleDate);
                }
                if (data.oracle.todaysPhrase) {
                    localStorage.setItem("todaysOraclePhrase", data.oracle.todaysPhrase);
                }
            }
            
            // Importar settings si existen
            if (data.settings) {
                if (data.settings.theme) {
                    localStorage.setItem("theme", data.settings.theme);
                    // Aplicar tema
                    if (data.settings.theme === "dark") {
                        document.body.classList.add("dark-mode");
                    } else {
                        document.body.classList.remove("dark-mode");
                    }
                }
            }
            
            this.saveProgress(); 
            this.ui.renderUnlockedList(this.unlocked, this.favorites, this.mensajes);
            this.updateAchievementsModal();
            
            // Recargar estadísticas en UI
            this.ui.statsData = this.ui.loadStatsData();
            
            // Fade in
            document.body.style.opacity = '1';
            
            setTimeout(() => {
                // Mensaje detallado de confirmación
                const secretsCount = this.unlocked.size;
                const achievementsCount = this.achievedLogros.size;
                const favoritesCount = this.favorites.size;
                
                this.ui.renderMessage(
                    "✨ ¡Recuerdos Restaurados!", 
                    `<strong>Progreso recuperado con éxito:</strong><br><br>
                    🔓 ${secretsCount} secretos descubiertos<br>
                    🏆 ${achievementsCount} logros alcanzados<br>
                    ❤️ ${favoritesCount} favoritos guardados<br><br>
                    ¡Bienvenida de vuelta! 💜`
                );
            }, 400);
        }, 300);
    }
    
    resetProgress() { if (confirm("¿Borrar todo?")) { localStorage.clear(); location.reload(); } }


    // ===========================================
    // SISTEMA DE PISTAS PROGRESIVAS
    // ===========================================

    // Obtener el código bloqueado más cercano a lo que escribió
    getClosestLockedCode(currentInput) {
        const lockedCodes = Object.keys(this.mensajes).filter(code => !this.unlocked.has(code));
        return this.getClosestLockedCodeFromList(currentInput, lockedCodes);
    }

    // Manejar solicitud de pista (click en bombilla)
    handleHintRequest() {
        const input = this.ui.elements.input;
        const currentInput = normalizeText(input.value.trim());
        
        // Obtener solo códigos bloqueados
        const lockedCodes = Object.keys(this.mensajes).filter(code => !this.unlocked.has(code));
        
        if (lockedCodes.length === 0) {
            this.ui.showToast("🎉 ¡Increíble! Has descubierto todos los secretos.");
            this.ui.triggerConfetti();
            return;
        }

        let targetCode;
        
        // Modo Explorador: Si no hay texto, sugerir un código aleatorio bloqueado
        if (!currentInput) {
            targetCode = lockedCodes[Math.floor(Math.random() * lockedCodes.length)];
            const pistaOriginal = this.mensajes[targetCode].pista || "Un secreto especial te espera...";
            this.ui.renderMessage("🌟 Señal del Universo", `Aquí tienes una señal para un nuevo secreto:<br><br>${pistaOriginal}`);
            return;
        }
        
        // Modo Ayuda: Buscar el más cercano entre los bloqueados
        targetCode = this.getClosestLockedCodeFromList(currentInput, lockedCodes);
        
        if (!targetCode) {
            this.ui.showToast("¡Escribe algo para buscar pistas!");
            return;
        }

        const dataSecreta = this.mensajes[targetCode];
        const pistaOriginal = dataSecreta && dataSecreta.pista 
            ? dataSecreta.pista 
            : "Es un secreto muy especial...";

        // Nivel 1 (0-2 fallos): Pista original
        if (this.failedAttempts < 3) {
            this.ui.renderMessage("💡 Pista", pistaOriginal);
        } 
        // Nivel 2 (3-4 fallos): Pista + estructura
        else if (this.failedAttempts < 5) {
            const info = `${pistaOriginal}<br><br><strong>Estructura:</strong> Son ${targetCode.length} caracteres y empieza por '${targetCode[0].toUpperCase()}'`;
            this.ui.renderMessage("💡 Pista Mejorada", info);
        } 
        // Nivel 3 (5+ fallos): Activar modo resonancia automáticamente
        else {
            this.ui.showToast("🔥 ¡Modo Radar activado! Mira el color del cuadro mientras escribes...");
            this.activateResonanceMode();
            
            setTimeout(() => {
                this.ui.renderMessage("💡 Pista Completa", `${pistaOriginal}<br><br><strong>Estructura:</strong> ${targetCode.length} caracteres, comienza por '${targetCode[0].toUpperCase()}' y termina en '${targetCode[targetCode.length - 1].toUpperCase()}'`);
            }, 500);
        }
    }

    // Obtener el código bloqueado más cercano de una lista específica
    getClosestLockedCodeFromList(currentInput, lockedCodes) {
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
        
        // Si está vacío, limpiar clases de resonancia
        if (!currentInput) {
            input.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot');
            return;
        }

        // Calcular distancia al código más cercano (solo bloqueados)
        const closestCode = this.getClosestLockedCode(currentInput);
        if (!closestCode) {
            input.classList.remove('resonance-cold', 'resonance-warm', 'resonance-hot');
            return;
        }

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
