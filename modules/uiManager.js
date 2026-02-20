/**
 * modules/uiManager.js
 * Versión Final Producción: Streaming Seguro + Glassmorphism (Sin Easter Eggs)
 * Actualizado: Iconos SVG en lugar de emojis
 */

import { normalizeText } from './utils.js';
import { descifrarArchivo } from './webCryptoDecryptor.js';
import { getSVGIcon } from './svgIcons.js';

export class UIManager {
        constructor(herramientas, oraclePhrases) {
        this.herramientas = herramientas || [];
        this.oraclePhrases = oraclePhrases || [];
        this.elements = {
            input: document.getElementById("codeInput"),
            contentDiv: document.getElementById("contenido"),
            progressBar: document.querySelector(".progress-bar-fill"),
            progressText: document.getElementById("progreso"),
            toastContainer: document.getElementById("achievement-toast-container"),
            menuButton: document.getElementById("menuButton"),
            dropdownMenu: document.getElementById("dropdownMenu"),
            importInput: document.getElementById("importInput"),
            unlockedSection: document.getElementById("unlockedSection"),
            unlockedList: document.getElementById("unlockedList"),
            searchUnlocked: document.getElementById("searchUnlocked"),
            categoryFilter: document.getElementById("categoryFilter"),
            filterFavBtn: document.getElementById("filterFavBtn"),
            closeUnlockedBtn: document.getElementById("closeUnlockedBtn"),
            // Modal de logros
            achievementsModal: document.getElementById("achievementsModal"),
            closeAchievementsModal: document.getElementById("closeAchievementsModal"),
            viewAchievementsBtn: document.getElementById("viewAchievementsBtn"),
            menuAchievements: document.getElementById("menuAchievements"),
            // Modal del oráculo
            oracleModal: document.getElementById("oracleModal"),
            closeOracleModal: document.getElementById("closeOracleModal"),
            oraclePhrase: document.getElementById("oraclePhrase"),
            menuOracle: document.getElementById("menuOracle"),
            // Modal de audio
            audioModal: document.getElementById("audioModal"),
            closeAudioModal: document.getElementById("closeAudioModal"),
            playlistGrid: document.getElementById("playlistGrid"),
            menuAudio: document.getElementById("menuAudio"),
            // Submenu de backup
            backupSubmenu: document.getElementById("backupSubmenu"),
            closeBackupSubmenu: document.getElementById("closeBackupSubmenu"),
            menuBackup: document.getElementById("menuBackup"),
            // Elementos para modo lectura
            readingModeModal: document.getElementById("readingModeModal"),
            exitReadingMode: document.getElementById("exitReadingMode"),
            readingModeText: document.getElementById("readingModeText"),
            // Saludo dinámico
            dynamicGreeting: document.querySelector(".dynamic-greeting"),
            // Modal de buzón
            mailboxModal: document.getElementById("mailboxModal"),
            closeMailboxModal: document.getElementById("closeMailboxModal"),
            menuMailbox: document.getElementById("menuMailbox"),
            mailboxList: document.getElementById("mailboxList"),
            mailViewer: document.getElementById("mailViewer"),
            mailboxBadge: document.getElementById("mailboxBadge"),
            menuBadge: document.getElementById("menuBadge")
        };

        this.cachedPassword = null; 
        this.showingFavoritesOnly = false;
        this.typewriterTimeout = null;
        this.statsData = this.loadStatsData(); // Cargar estadísticas
        
        // Estado del buzón
        this.emailsData = null;
        this.emailsLoaded = false;
        this.readEmails = new Set(JSON.parse(localStorage.getItem("readEmails") || "[]"));

        this.initTheme();
        this.setupMenuListeners();
        this.setupListListeners();
        this.setupAchievementsModal(); // Configurar modal de logros
        this.setupOracleModal(); // Configurar modal del oráculo
        this.setupAudioModal(); // Configurar modal de audio
        this.setupBackupSubmenu(); // Configurar submenu de backup
        this.setupReadingMode(); // Configurar modo lectura
        this.setupMailboxModal(); // Configurar modal de buzón
        this.initDynamicPlaceholder();
        this.updateDynamicGreeting(); // Actualizar saludo
        this.checkMailboxNotifications(); // Verificar notificaciones
    }

    // Cargar estadísticas del localStorage
    loadStatsData() {
        return {
            totalTime: parseInt(localStorage.getItem("totalTime") || "0"),
            lastVisit: localStorage.getItem("lastVisit") || new Date().toDateString(),
            currentStreak: parseInt(localStorage.getItem("currentStreak") || "0"),
            longestStreak: parseInt(localStorage.getItem("longestStreak") || "0"),
            firstVisit: localStorage.getItem("firstVisit") || new Date().toDateString()
        };
    }

    // Actualizar estadísticas
    updateStats() {
        const today = new Date().toDateString();
        const lastVisit = this.statsData.lastVisit;
        
        // Si es el primer día
        if (!localStorage.getItem("firstVisit")) {
            localStorage.setItem("firstVisit", today);
            this.statsData.firstVisit = today;
            this.statsData.currentStreak = 1;
            localStorage.setItem("currentStreak", "1");
            localStorage.setItem("lastVisit", today);
            this.statsData.lastVisit = today;
            return;
        }
        
        // Actualizar racha
        if (lastVisit !== today) {
            const lastVisitDate = new Date(lastVisit);
            const todayDate = new Date(today);
            const diffTime = todayDate.getTime() - lastVisitDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Es el día siguiente, aumentar racha
                this.statsData.currentStreak++;
            } else if (diffDays > 1) {
                // Se rompió la racha, reiniciar
                this.statsData.currentStreak = 1;
            }
            // Si diffDays === 0, es el mismo día, no hacer nada
            
            if (this.statsData.currentStreak > this.statsData.longestStreak) {
                this.statsData.longestStreak = this.statsData.currentStreak;
                localStorage.setItem("longestStreak", this.statsData.longestStreak.toString());
            }
            
            localStorage.setItem("currentStreak", this.statsData.currentStreak.toString());
            localStorage.setItem("lastVisit", today);
            this.statsData.lastVisit = today;
        }
        
        // Incrementar tiempo (simulado, en realidad deberías usar un timer)
        this.statsData.totalTime++;
        localStorage.setItem("totalTime", this.statsData.totalTime.toString());
    }

    // Configurar modal de logros
    setupAchievementsModal() {
        if (this.elements.viewAchievementsBtn) {
            this.elements.viewAchievementsBtn.addEventListener("click", () => this.openAchievementsModal());
        }
        
        if (this.elements.closeAchievementsModal) {
            this.elements.closeAchievementsModal.addEventListener("click", () => this.closeAchievementsModal());
        }
        
        if (this.elements.achievementsModal) {
            this.elements.achievementsModal.addEventListener("click", (e) => {
                if (e.target === this.elements.achievementsModal) {
                    this.closeAchievementsModal();
                }
            });
        }
    }

    // Abrir modal de logros
    openAchievementsModal() {
        if (!this.elements.achievementsModal) return;
        // Cerrar menú desplegable si está abierto
        if (this.elements.dropdownMenu) {
            this.elements.dropdownMenu.classList.remove("show");
        }
        this.updateStats();
        this.renderAchievementsModal();
        this.elements.achievementsModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    // Cerrar modal de logros
    closeAchievementsModal() {
        if (!this.elements.achievementsModal) return;
        this.elements.achievementsModal.classList.remove("show");
        document.body.style.overflow = "";
    }

    // Renderizar modal de logros
    renderAchievementsModal() {
        // Esta función se definirá más adelante con los datos del juego
        // Por ahora, solo preparamos la estructura
    }

    dismissKeyboard() { if (this.elements.input) this.elements.input.blur(); }

    initTheme() {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") document.body.classList.add("dark-mode");
    }

    toggleDarkMode() {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        this.showToast(isDark ? "Modo Oscuro Activado" : "Modo Claro Activado");
    }

    // --- VISUALES ---
    initDynamicPlaceholder() {
        const frases = ["Escribe aquí...", "Una fecha especial...", "¿Nuestro lugar?", "Un apodo...", "Nombre de canción...", "Batman"];
        let index = 0;
        setInterval(() => {
            index = (index + 1) % frases.length;
            if(this.elements.input) this.elements.input.setAttribute("placeholder", frases[index]);
        }, 3500);
    }

    triggerConfetti() {
        // @ts-ignore
        if (typeof confetti === 'undefined') return;
        const count = 200; const defaults = { origin: { y: 0.7 }, zIndex: 1500 };
        function fire(r, opts) { 
            // @ts-ignore
            confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * r) })); 
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    }

    typeWriterEffect(element, text) {
    // Limpieza de animación previa
    if (this.typewriterTimeout) {
        clearTimeout(this.typewriterTimeout);
        this.typewriterTimeout = null;
    }

    this.typewriterSkip = false;

    // Protección básica
    if (!element || !text) return;

    element.innerHTML = "";
    element.classList.add("typewriter-cursor");

    let i = 0;
    const textLength = text.length;

    // ---- Velocidad adaptativa ----
    const slowStart = 65;
    const minSpeed = 22;
    const accelRange = Math.min(220, textLength * 0.45);

    // ---- Doble toque real (sin bug móvil) ----
    let lastTapTime = 0;

    const finishInstantly = () => {
        if (!element) return;

        // Cancelar futuras ejecuciones
        this.typewriterSkip = true;
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
            this.typewriterTimeout = null;
        }

        // Render completo
        element.innerHTML = "";
        text.split('\n').forEach((line, idx) => {
            if (idx > 0) element.appendChild(document.createElement('br'));
            element.appendChild(document.createTextNode(line));
        });

        element.classList.remove("typewriter-cursor");
        element.removeEventListener("pointerdown", tapHandler);
    };

    const tapHandler = () => {
        const now = Date.now();
        const delta = now - lastTapTime;

        if (delta > 0 && delta < 300) {
            finishInstantly();
            lastTapTime = 0;
            return;
        }

        lastTapTime = now;
    };

    // Un solo evento, compatible mouse + touch
    element.addEventListener("pointerdown", tapHandler);

    const type = () => {
        // Abortos seguros
        if (!element || this.typewriterSkip) return;

        if (i >= textLength) {
            element.classList.remove("typewriter-cursor");
            element.removeEventListener("pointerdown", tapHandler);
            return;
        }

        const char = text.charAt(i);

        if (char === '\n') {
            element.appendChild(document.createElement('br'));
        } else {
            element.appendChild(document.createTextNode(char));
        }

        // Progresión suave (cartas largas)
        const progress = Math.min(i / accelRange, 1);
        let speed = slowStart - (slowStart - minSpeed) * progress;

        // Pausas humanas
        if (['.', '!', '?'].includes(char)) speed += 280;
        if (char === '\n') speed += 360;

        i++;
        this.typewriterTimeout = setTimeout(type, speed);
    };

    type();
}

    // --- RENDERIZADO ---
    renderContent(data, key) {
        if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);
        const container = this.elements.contentDiv; 
        container.hidden = false; container.innerHTML = "";

        const h2 = document.createElement("h2");
        h2.textContent = key ? `Descubierto: ${key}` : "¡Sorpresa!";
        h2.style.textTransform = "capitalize";
        container.appendChild(h2);

        if (data.texto && data.type !== 'text' && data.type !== 'internal') {
            const p = document.createElement("p"); p.textContent = data.texto; container.appendChild(p);
        }

        switch (data.type) {
            case "text":
                const pText = document.createElement("p");
                pText.className = "mensaje-texto";
                pText.style.position = "relative"; // Para posicionar el botón
                
                if (data.categoria && ['pensamiento'].includes(data.categoria.toLowerCase())) {
                    this.typeWriterEffect(pText, data.texto);
                } else {
                    pText.textContent = data.texto;
                }
                
                container.appendChild(pText);
                
                // Agregar botón de modo lectura si el texto es largo
                const readingBtn = this.addReadingModeButton(data.texto);
                if (readingBtn) {
                    container.appendChild(readingBtn);
                }
                break;
            case "audio":
                // Pausar música de fondo
                if (window.audioManager) {
                    window.audioManager.pauseBackground();
                }

                const audio = document.createElement("audio");
                audio.src = data.audio;
                audio.autoplay = true;
                audio.controls = false;
                audio.style.display = "none";

                // Reanudar música cuando termine o se oculte el contenido
                audio.addEventListener("ended", () => {
                    if (window.audioManager) {
                        window.audioManager.resumeBackground();
                    }
                });

                container.appendChild(audio);

                if (data.texto) {
                    const p = document.createElement("p");
                    p.className = "mensaje-texto";
                    p.style.textAlign = "center";
                    p.innerText = data.texto;
                    container.appendChild(p);
                }
                break;
            case "image":
                const img = document.createElement("img");
                img.src = data.imagen; img.alt = "Secreto"; img.style.cursor = "zoom-in";
                img.onclick = () => {
                    // @ts-ignore
                    const v = new Viewer(img, { hidden(){v.destroy()}, navbar:0, title:0, toolbar: {zoomIn:1, zoomOut:1, reset:1, rotateLeft:1} });
                    v.show();
                };
                container.appendChild(img);
                break;
            case "image_audio":
                // Pausar música de fondo
                if (window.audioManager) {
                    window.audioManager.pauseBackground();
                }

                const imgMixed = document.createElement("img");
                imgMixed.src = data.imagen; 
                imgMixed.alt = "Momento Especial";
                
                imgMixed.style.maxWidth = "100%";
                imgMixed.style.borderRadius = "12px";
                imgMixed.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
                imgMixed.style.cursor = "zoom-in"; 
                
                // Funcionalidad de Zoom (ViewerJS)
                imgMixed.onclick = () => {
                    // @ts-ignore
                    const v = new Viewer(imgMixed, { hidden(){v.destroy()}, navbar:0, title:0, toolbar: {zoomIn:1, zoomOut:1, reset:1, rotateLeft:1} });
                    v.show();
                };
                container.appendChild(imgMixed);

                const audioMixed = document.createElement("audio");
                audioMixed.src = data.audio;
                audioMixed.autoplay = true;
                audioMixed.controls = false;
                audioMixed.style.display = "none";

                // Reanudar música cuando termine
                audioMixed.addEventListener("ended", () => {
                    if (window.audioManager) {
                        window.audioManager.resumeBackground();
                    }
                });

                container.appendChild(audioMixed);
                
                if (data.texto) {
                    const p = document.createElement("p");
                    p.className = "mensaje-texto"; 
                    p.style.marginTop = "15px";
                    p.innerText = data.texto;
                    container.appendChild(p);
                }
                break;
            case "video":
                // Pausar música de fondo
                if (window.audioManager) {
                    window.audioManager.pauseBackground();
                }

                if (data.videoEmbed) {
                    const w = document.createElement("div"); 
                    w.className="video-wrapper";
                    w.innerHTML = `<div class="video-loader"></div><iframe src="${data.videoEmbed}" class="video-frame" allow="autoplay; encrypted-media; fullscreen" onload="this.style.opacity=1;this.previousElementSibling.style.display='none'"></iframe>`;
                    container.appendChild(w);

                    // Nota: Para iframes externos no podemos detectar el "ended"
                    // Pero podemos reanudar cuando el usuario oculte el contenido
                    // esto se maneja en el gameEngine cuando se cambia de secreto
                }
                break;
            case "internal":
                const dest = data.archivo || data.link;
                if(!dest) { container.innerHTML += "<p style='color:red'>Error: Sin ruta.</p>"; break; }
                const divInt = document.createElement("div"); divInt.className="internal-wrapper";
                divInt.innerHTML = `<a href="${dest}" target="_blank" class="button small-button" style="margin-bottom:10px"><i class="fas fa-expand"></i> Pantalla Completa</a><iframe src="${dest}" class="internal-frame" style="border:none;background:transparent" allowtransparency="true"></iframe>`;
                container.appendChild(divInt);
                break;
            case "link":
                const aLink = document.createElement("a"); aLink.href=data.link; aLink.target="_blank"; aLink.className="button"; aLink.innerHTML='Abrir Enlace <i class="fas fa-external-link-alt"></i>'; container.appendChild(aLink);
                break;
            
            // --- MANEJO DE DESCARGAS Y STREAMING ---
            case "download":
                const dlBtn = document.createElement("button");
                dlBtn.className = "button";
                dlBtn.style.position = "relative"; 
                dlBtn.style.overflow = "hidden";

                const urlF = data.descarga.url||"";
                const esCifrado = data.encrypted || urlF.endsWith(".enc") || urlF.endsWith(".wenc");
                
                // Limpiar nombre visualmente
                const nombreLimpio = data.descarga.nombre.replace(/\.(wenc|enc)$/i, "");

                const btnContent = esCifrado 
                    ? `<i class="fas fa-lock"></i> Desbloquear ${nombreLimpio}`
                    : `<i class="fas fa-download"></i> Descargar ${nombreLimpio}`;
                
                dlBtn.innerHTML = `<span class="btn-text-layer">${btnContent}</span>`;

                dlBtn.onclick = () => {
                    if (esCifrado) {
                        const iniciarProceso = async (password) => {
                            // UI Carga
                            dlBtn.disabled = true;
                            const progressBg = document.createElement("div");
                            progressBg.className = "progress-btn-bg";
                            dlBtn.prepend(progressBg);
                            const textLayer = dlBtn.querySelector(".btn-text-layer");
                            const originalText = textLayer.innerHTML;

                            try {
                                const blobDescifrado = await descifrarArchivo(
                                    data.descarga.url, 
                                    data.descarga.nombre, 
                                    password,
                                    (percent, statusText) => {
                                        progressBg.style.width = `${percent}%`;
                                        if (percent < 100) {
                                            textLayer.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${percent}% Cargando...`;
                                        } else {
                                            textLayer.innerHTML = `<i class="fas fa-cog fa-spin"></i> ${statusText || 'Abriendo...'}`;
                                        }
                                    }
                                );

                                dlBtn.disabled = false;
                                progressBg.remove();
                                textLayer.innerHTML = originalText;

                                if (blobDescifrado) {
                                    this.cachedPassword = password; 
                                    this.showToast("¡Acceso concedido!");
                                    this.triggerConfetti();
                                    
                                    // Abrir Visor Multimedia (con nombre limpio)
                                    const nombreFinal = data.descarga.nombre.replace(/\.(wenc|enc)$/i, "");
                                    this.renderMediaModal(blobDescifrado, nombreFinal);
                                } else {
                                    this.cachedPassword = null; 
                                    this.showError();
                                    alert("Contraseña incorrecta.");
                                }
                            } catch (err) {
                                dlBtn.disabled = false;
                                if(progressBg) progressBg.remove();
                                textLayer.innerHTML = originalText;
                                console.error(err);
                                if(err.message.includes("ERROR_404")) {
                                    alert("Error 404: Archivo no encontrado.");
                                } else {
                                    alert("Error técnico: " + err.message);
                                }
                            }
                        };

                        if (this.cachedPassword) {
                            iniciarProceso(this.cachedPassword);
                        } else {
                            this.askPassword(nombreLimpio, (pass) => iniciarProceso(pass));
                        }
                    } else {
                        // Descarga directa
                        const a = document.createElement("a"); a.href=data.descarga.url; a.download=data.descarga.nombre; a.click();
                    }
                };
                container.appendChild(dlBtn);
                break;
        }
        container.classList.remove("fade-in"); void container.offsetWidth; container.classList.add("fade-in");
    }

    /**
     * VISOR MULTIMEDIA SEGURO (Alineado)
     */
    renderMediaModal(blob, filename) {
        const ext = filename.split('.').pop().toLowerCase();
        let mimeType = "application/octet-stream";
        let type = "unknown";

        if (['jpg','jpeg','png','gif','webp'].includes(ext)) { mimeType = `image/${ext}`; type = "image"; }
        else if (['mp4','webm','mov'].includes(ext)) { mimeType = `video/${ext === 'mov' ? 'mp4' : ext}`; type = "video"; }
        else if (['mp3','wav','ogg'].includes(ext)) { mimeType = `audio/${ext}`; type = "audio"; }

        if (type === "unknown") {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
            return;
        }

        const safeBlob = new Blob([blob], { type: mimeType });
        const objectUrl = URL.createObjectURL(safeBlob);

        // --- DOM ---
        const overlay = document.createElement("div");
        overlay.className = "media-modal-overlay"; 
        
        const contentContainer = document.createElement("div");
        contentContainer.className = "media-content-container";

        let mediaElement;
        if (type === "image") {
            mediaElement = document.createElement("img");
            mediaElement.className = "secure-media";
        } else if (type === "video") {
            mediaElement = document.createElement("video");
            mediaElement.className = "secure-media";
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            mediaElement.oncontextmenu = (e) => e.preventDefault();
        } else if (type === "audio") {
            mediaElement = document.createElement("audio");
            mediaElement.className = "secure-media-audio";
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            contentContainer.style.height = "auto";
            contentContainer.style.padding = "20px";
            contentContainer.style.background = "rgba(255,255,255,0.1)";
            contentContainer.style.borderRadius = "50px";
        }

        mediaElement.src = objectUrl;
        contentContainer.appendChild(mediaElement);

        const controls = document.createElement("div");
        controls.className = "media-controls";

        const btnDownload = document.createElement("button");
        btnDownload.className = "media-btn";
        btnDownload.innerHTML = '<i class="fas fa-save"></i> Guardar';
        btnDownload.onclick = () => {
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = filename;
            a.click();
        };

        const btnClose = document.createElement("button");
        btnClose.className = "media-btn close";
        btnClose.innerHTML = '<i class="fas fa-times"></i> Cerrar';
        
        const closeFn = () => {
            document.body.removeChild(overlay);
            URL.revokeObjectURL(objectUrl);
        };
        btnClose.onclick = closeFn;

        controls.appendChild(btnDownload);
        controls.appendChild(btnClose);

        // Orden: Imagen arriba, Botones abajo
        overlay.appendChild(contentContainer);
        overlay.appendChild(controls);
        
        document.body.appendChild(overlay);
    }

    /**
     * MODAL PASSWORD (Glassmorphism)
     */
    askPassword(filename, callback) {
        const overlay = document.createElement("div");
        overlay.className = "glass-overlay";
        
        const card = document.createElement("div");
        card.className = "glass-card";
        card.innerHTML = `<h3 style="margin-top:0;">Desbloquear Archivo</h3><p style="font-size:0.9em;margin-bottom:15px;opacity:0.8">Introduce la contraseña para:<br><b>${filename}</b></p>`;

        const input = document.createElement("input");
        input.type = "password"; input.placeholder = "Contraseña...";
        input.style.cssText = "width:100%;padding:12px;margin-bottom:15px;border:1px solid rgba(0,0,0,0.1);border-radius:8px;font-size:16px;box-sizing:border-box;background:rgba(255,255,255,0.9);";
        input.setAttribute("autocomplete", "off"); input.setAttribute("autocorrect", "off"); input.setAttribute("autocapitalize", "off");

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex"; btnContainer.style.gap = "10px";

        const btnCancel = document.createElement("button");
        btnCancel.textContent = "Cancelar";
        btnCancel.style.cssText = "flex:1;padding:10px;border:none;background:rgba(0,0,0,0.1);border-radius:6px;cursor:pointer;color:inherit;";
        
        const btnConfirm = document.createElement("button");
        btnConfirm.textContent = "Desbloquear";
        btnConfirm.style.cssText = "flex:1;padding:10px;border:none;background:var(--primary-color, #ff4d6d);color:white;border-radius:6px;cursor:pointer;font-weight:bold;box-shadow:0 4px 15px rgba(255, 77, 109, 0.4);";

        btnContainer.appendChild(btnCancel); btnContainer.appendChild(btnConfirm);
        card.appendChild(input); card.appendChild(btnContainer); overlay.appendChild(card);
        document.body.appendChild(overlay);
        input.focus();

        const close = () => document.body.removeChild(overlay);
        btnCancel.onclick = close;
        const submit = () => { const pass = input.value; if(pass){ close(); callback(pass); } else { input.style.border = "1px solid red"; input.focus(); } };
        btnConfirm.onclick = submit; input.onkeydown = (e) => { if(e.key === 'Enter') submit(); };
    }

    // --- HELPERS (Toast, Menú, Audio) ---
    renderMessage(t,b){const c=this.elements.contentDiv;c.hidden=0;c.innerHTML=`<h2>${t}</h2><p>${b}</p>`;c.classList.remove("fade-in");void c.offsetWidth;c.classList.add("fade-in");}
    showError(){this.elements.input.classList.add("shake","error");setTimeout(()=>this.elements.input.classList.remove("shake"),500);}
    showSuccess(){this.elements.input.classList.remove("error");this.elements.input.classList.add("success");}
    clearInput(){this.elements.input.value="";}
    updateProgress(u,t){const p=t>0?Math.round((u/t)*100):0;this.elements.progressBar.style.width=`${p}%`;this.elements.progressText.textContent=`Descubiertos: ${u} / ${t}`;}
    showToast(m){const t=document.createElement("div");t.className="achievement-toast";t.innerHTML=m;this.elements.toastContainer.appendChild(t);setTimeout(()=>t.remove(),4000);}
    updateAudioUI(play,name){const b=document.getElementById("audioPlayPause"); const l=document.getElementById("trackName");if(b)b.innerHTML=play?'<i class="fas fa-pause"></i>':'<i class="fas fa-play"></i>';if(l&&name)l.textContent=name.replace(/_/g," ").replace(/\.[^/.]+$/,"");}
    
    setupMenuListeners(){
        this.elements.menuButton.addEventListener("click",(e)=>{e.stopPropagation();this.elements.dropdownMenu.classList.toggle("show");});
        document.addEventListener("click",(e)=>{if(!this.elements.menuButton.contains(e.target)&&!this.elements.dropdownMenu.contains(e.target))this.elements.dropdownMenu.classList.remove("show");});
        this.bindMenuAction("menuHome",()=>{this.toggleUnlockedPanel(0);window.scrollTo({top:0,behavior:'smooth'});});
        this.bindMenuAction("menuShowUnlocked",()=>this.toggleUnlockedPanel(1));
        this.bindMenuAction("menuFavorites",()=>{this.toggleUnlockedPanel(1);this.showingFavoritesOnly=1;this.updateFilterUI();this.triggerListFilter();});
        this.bindMenuAction("menuAchievements",()=>this.openAchievementsModal());
        this.bindMenuAction("menuOracle",()=>this.openOracleModal());
        this.bindMenuAction("menuDarkMode",()=>this.toggleDarkMode());
        this.bindMenuAction("menuAudio",()=>this.openAudioModal());
        this.bindMenuAction("menuBackup",()=>this.openBackupSubmenu());
        this.elements.importInput.addEventListener("change",(e)=>{if(e.target.files.length)this.handleImportFile(e.target.files[0]);this.elements.importInput.value="";});
    }
    bindMenuAction(id,fn){const b=document.getElementById(id);if(b)b.addEventListener("click",()=>{fn();this.elements.dropdownMenu.classList.remove("show");});}
    
    // --- MODAL DE AUDIO ---
    setupAudioModal() {
        if (this.elements.closeAudioModal) {
            this.elements.closeAudioModal.addEventListener("click", () => this.closeAudioModal());
        }
        
        if (this.elements.audioModal) {
            this.elements.audioModal.addEventListener("click", (e) => {
                if (e.target === this.elements.audioModal) {
                    this.closeAudioModal();
                }
            });
        }
    }

    openAudioModal() {
        if (!this.elements.audioModal) return;
        if (this.elements.dropdownMenu) {
            this.elements.dropdownMenu.classList.remove("show");
        }
        this.renderAudioModal();
        this.elements.audioModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    closeAudioModal() {
        if (!this.elements.audioModal) return;
        this.elements.audioModal.classList.remove("show");
        document.body.style.overflow = "";
    }

    renderAudioModal() {
        // Esta función será llamada por el audioManager
        // para renderizar la playlist
    }

    updateAudioModal(state) {
        // Actualizar UI del reproductor
        const playPauseBtn = document.getElementById("audioPlayPause");
        const muteBtn = document.getElementById("audioMute");
        const shuffleBtn = document.getElementById("audioShuffle");
        const volumeSlider = document.getElementById("volumeSlider");
        const currentTrackTitle = document.getElementById("currentTrackTitle");
        const currentTrackArtist = document.getElementById("currentTrackArtist");
        const currentTrackCover = document.getElementById("currentTrackCover");

        if (playPauseBtn) {
            playPauseBtn.innerHTML = state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }

        if (muteBtn) {
            muteBtn.innerHTML = state.isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
            muteBtn.classList.toggle("active", state.isMuted);
        }

        if (shuffleBtn) {
            shuffleBtn.classList.toggle("active", state.isShuffling);
        }

        if (volumeSlider) {
            volumeSlider.value = state.volume;
        }

        if (state.playlist && state.playlist[state.currentTrackIndex]) {
            const track = state.playlist[state.currentTrackIndex];
            if (currentTrackTitle) currentTrackTitle.textContent = track.title;
            if (currentTrackArtist) currentTrackArtist.textContent = track.artist || "---";
            if (currentTrackCover) currentTrackCover.src = track.cover;
        }

        // Renderizar grid de playlist
        this.renderPlaylistGrid(state.playlist, state.currentTrackIndex);
    }

    renderPlaylistGrid(playlist, currentIndex) {
        if (!this.elements.playlistGrid || !playlist) return;

        this.elements.playlistGrid.innerHTML = "";

        playlist.forEach((track, index) => {
            const item = document.createElement("div");
            item.className = "playlist-item";
            if (index === currentIndex) item.classList.add("active");

            item.innerHTML = `
                <img src="${track.cover}" alt="${track.title}" class="playlist-item-cover" onerror="this.src='assets/images/music-cover/placeholder.jpg'">
                <div class="playlist-item-title">${track.title}</div>
                <div class="playlist-item-artist">${track.artist || "---"}</div>
            `;

            item.addEventListener("click", () => {
                if (window.audioManager) {
                    window.audioManager.playTrack(index);
                }
            });

            this.elements.playlistGrid.appendChild(item);
        });
    }

    // --- SUBMENU DE BACKUP ---
    setupBackupSubmenu() {
        if (this.elements.closeBackupSubmenu) {
            this.elements.closeBackupSubmenu.addEventListener("click", () => this.closeBackupSubmenu());
        }

        if (this.elements.backupSubmenu) {
            this.elements.backupSubmenu.addEventListener("click", (e) => {
                if (e.target === this.elements.backupSubmenu) {
                    this.closeBackupSubmenu();
                }
            });
        }

        // Botones de exportar e importar dentro del submenu
        const exportBtn = document.getElementById("menuExport");
        const importBtn = document.getElementById("menuImport");

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                this.exportProgress();
                this.closeBackupSubmenu();
            });
        }

        if (importBtn) {
            importBtn.addEventListener("click", () => {
                this.elements.importInput.click();
                this.closeBackupSubmenu();
            });
        }
    }

    openBackupSubmenu() {
        if (!this.elements.backupSubmenu) return;
        if (this.elements.dropdownMenu) {
            this.elements.dropdownMenu.classList.remove("show");
        }
        this.elements.backupSubmenu.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    closeBackupSubmenu() {
        if (!this.elements.backupSubmenu) return;
        this.elements.backupSubmenu.style.display = "none";
        document.body.style.overflow = "";
    }
    
    
    setupListListeners(){
        this.elements.searchUnlocked.addEventListener("input",()=>this.triggerListFilter());
        this.elements.categoryFilter.addEventListener("change",()=>this.triggerListFilter());
        this.elements.filterFavBtn.addEventListener("click",()=>{this.showingFavoritesOnly=!this.showingFavoritesOnly;this.updateFilterUI();this.triggerListFilter();});
        this.elements.closeUnlockedBtn.addEventListener("click",()=>this.toggleUnlockedPanel(0));
    }
    toggleUnlockedPanel(s){this.elements.unlockedSection.hidden=!s;if(s)this.elements.unlockedSection.scrollIntoView({behavior:'smooth'});}
    updateFilterUI(){const b=this.elements.filterFavBtn;b.classList.toggle("active",this.showingFavoritesOnly);b.innerHTML=this.showingFavoritesOnly?'<i class="fas fa-heart"></i> Favoritos':'<i class="far fa-heart"></i> Favoritos';}
    renderUnlockedList(u,f,m){
        this.currentData={u,f,m}; const cats=new Set();Object.values(m).forEach(v=>{if(v.categoria)cats.add(v.categoria)});
        const cur=this.elements.categoryFilter.value; this.elements.categoryFilter.innerHTML='<option value="">Todas</option>';
        cats.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;if(c===cur)o.selected=1;this.elements.categoryFilter.appendChild(o)});
        this.triggerListFilter();
    }
    triggerListFilter(){
        if(!this.currentData)return; const {u,f,m}=this.currentData;
        const s=normalizeText(this.elements.searchUnlocked.value); const cat=this.elements.categoryFilter.value;
        this.elements.unlockedList.innerHTML=""; let vc=0;
        Object.keys(m).sort().forEach(code=>{
            const d=m[code]; const isU=u.has(code);
            if(this.showingFavoritesOnly&&!f.has(code))return;
            if(s&&isU&&!normalizeText(code).includes(s))return;
            if(cat&&d.categoria!==cat)return;
            vc++; const li=document.createElement("li");
            if(isU){
                li.className="lista-codigo-item"; li.innerHTML=`<div style="flex-grow:1"><span class="codigo-text">${code}</span><span class="category">${d.categoria}</span></div>`;
                const fb=document.createElement("button");fb.className=`favorite-toggle-btn ${f.has(code)?'active':''}`;fb.innerHTML=`<i class="${f.has(code)?'fas':'far'} fa-heart"></i>`;
                fb.onclick=(e)=>{e.stopPropagation();if(this.onToggleFavorite)this.onToggleFavorite(code);};
                li.onclick=()=>{if(this.onCodeSelected)this.onCodeSelected(code);this.elements.contentDiv.scrollIntoView({behavior:'smooth'});}; li.appendChild(fb);
            }else{
                li.className="lista-codigo-item locked"; li.innerHTML=`<div style="flex-grow:1;display:flex;align-items:center;"><i class="fas fa-lock lock-icon"></i><div><span class="codigo-text">??????</span><span class="category" style="opacity:0.5">${d.categoria||'Secreto'}</span></div></div>`;
                li.onclick=()=>this.showToast(`${getSVGIcon('lock')} ¡Sigue buscando!`);
            }
            this.elements.unlockedList.appendChild(li);
        });
        if(vc===0)this.elements.unlockedList.innerHTML='<p style="text-align:center;width:100%;opacity:0.7">Sin resultados.</p>';
    }
    
    exportProgress(){
        // Backup 2.0 - Exportación integral de todo el estado
        const exportData = {
            unlocked: JSON.parse(localStorage.getItem("desbloqueados")||"[]"),
            favorites: JSON.parse(localStorage.getItem("favoritos")||"[]"),
            achievements: JSON.parse(localStorage.getItem("logrosAlcanzados")||"[]"),
            readEmails: JSON.parse(localStorage.getItem("readEmails")||"[]"),
            stats: {
                totalTime: parseInt(localStorage.getItem("totalTime") || "0"),
                currentStreak: parseInt(localStorage.getItem("currentStreak") || "0"),
                longestStreak: parseInt(localStorage.getItem("longestStreak") || "0"),
                firstVisit: localStorage.getItem("firstVisit") || null,
                lastVisit: localStorage.getItem("lastVisit") || null,
                failedAttempts: parseInt(localStorage.getItem("failedAttempts") || "0")
            },
            oracle: {
                lastOracleDate: localStorage.getItem("lastOracleDate") || null,
                todaysPhrase: localStorage.getItem("todaysOraclePhrase") || null
            },
            settings: {
                theme: localStorage.getItem("theme") || "light"
            },
            metadata: {
                appVersion: "2.3",
                exportedAt: new Date().toISOString(),
                totalSecrets: 0,
                totalAchievements: 0
            }
        };
        
        // Calcular metadata después de crear el objeto
        exportData.metadata.totalSecrets = exportData.unlocked.length;
        exportData.metadata.totalAchievements = exportData.achievements.length;
        
        const b=new Blob([JSON.stringify(exportData,null,2)],{type:"application/json"});
        const u=URL.createObjectURL(b);
        const a=document.createElement("a");
        a.href=u;
        a.download=`backup_completo_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(u);
        this.showToast(`${getSVGIcon('sparkles')} Backup completo exportado`);
    }
    handleImportFile(f){const r=new FileReader();r.onload=(e)=>{try{const d=JSON.parse(e.target.result);if(this.onImportData)this.onImportData(d);}catch(z){this.showToast("Archivo inválido");}};r.readAsText(f);}

    // ===========================================
    // FUNCIONES PARA MODAL DE LOGROS
    // ===========================================

    // Actualizar el modal de logros con datos del juego
    updateAchievementsModal(unlocked, favorites, mensajes, logros, achievedLogros) {
        // Guardar los datos para uso posterior
        this.gameData = { unlocked, favorites, mensajes, logros, achievedLogros };
    }

    // Renderizar el modal completo de logros
    renderAchievementsModal() {
        if (!this.gameData) return;
        
        const { unlocked, favorites, mensajes, logros, achievedLogros } = this.gameData;
        const totalCodes = Object.keys(mensajes).length;
        const unlockedCount = unlocked.size;
        const favoriteCount = favorites.size;
        
        // Calcular nivel y título del usuario
        const levelData = this.calculateUserLevel(unlockedCount, totalCodes);
        
        // Renderizar nivel del usuario
        this.renderUserLevel(levelData, unlockedCount, totalCodes);
        
        // Renderizar estadísticas
        this.renderStats(unlockedCount, favoriteCount, totalCodes);
        
        // Renderizar categorías
        this.renderCategories(unlocked, mensajes);
        
        // Renderizar logros
        this.renderAchievements(logros, achievedLogros, unlockedCount);
    }

    // Calcular nivel del usuario
    calculateUserLevel(unlockedCount, totalCodes) {
        const levels = [
            { level: 1, title: "Explorador Novato", desc: "Comenzando tu viaje de descubrimiento", required: 0 },
            { level: 2, title: "Buscador Curioso", desc: "Tu curiosidad te lleva más lejos", required: 5 },
            { level: 3, title: "Aventurero Dedicado", desc: "Cada secreto te acerca más", required: 10 },
            { level: 4, title: "Cazador de Misterios", desc: "Los enigmas no pueden esconderse de ti", required: 20 },
            { level: 5, title: "Detective del Corazón", desc: "Descubriendo el mapa de nuestro amor", required: 40 },
            { level: 6, title: "Maestro de Secretos", desc: "Conoces más que nadie sobre nosotros", required: 70 },
            { level: 7, title: "Guardián de Recuerdos", desc: "Cada momento está grabado en tu alma", required: 100 },
            { level: 8, title: "Leyenda del Amor", desc: "Tu dedicación es infinita", required: 150 },
            { level: 9, title: "Alma Gemela Completa", desc: "Has descubierto todos mis secretos", required: 223 }
        ];
        
        let currentLevel = levels[0];
        let nextLevel = levels[1];
        
        for (let i = 0; i < levels.length; i++) {
            if (unlockedCount >= levels[i].required) {
                currentLevel = levels[i];
                nextLevel = levels[i + 1] || currentLevel;
            } else {
                break;
            }
        }
        
        const progressInLevel = unlockedCount - currentLevel.required;
        const requiredForNext = nextLevel.required - currentLevel.required;
        const progressPercent = nextLevel !== currentLevel 
            ? (progressInLevel / requiredForNext) * 100 
            : 100;
        
        return {
            ...currentLevel,
            nextLevel,
            progressPercent,
            progressText: nextLevel !== currentLevel 
                ? `${progressInLevel} / ${requiredForNext} para siguiente nivel`
                : "¡Nivel máximo alcanzado!"
        };
    }

    // Renderizar nivel del usuario
    renderUserLevel(levelData, unlockedCount, totalCodes) {
        const userLevel = document.getElementById("userLevel");
        const userTitle = document.getElementById("userTitle");
        const userTitleDesc = document.getElementById("userTitleDesc");
        const levelProgressFill = document.getElementById("levelProgressFill");
        const levelProgressText = document.getElementById("levelProgressText");
        
        if (userLevel) userLevel.textContent = levelData.level;
        if (userTitle) userTitle.textContent = levelData.title;
        if (userTitleDesc) userTitleDesc.textContent = levelData.desc;
        if (levelProgressFill) levelProgressFill.style.width = `${levelData.progressPercent}%`;
        if (levelProgressText) levelProgressText.textContent = levelData.progressText;
    }

    // Renderizar estadísticas
    renderStats(unlockedCount, favoriteCount, totalCodes) {
        const totalUnlocked = document.getElementById("totalUnlocked");
        const currentStreak = document.getElementById("currentStreak");
        const totalTime = document.getElementById("totalTime");
        const favoriteCountElem = document.getElementById("favoriteCount");
        
        if (totalUnlocked) totalUnlocked.textContent = `${unlockedCount}/${totalCodes}`;
        if (currentStreak) currentStreak.textContent = this.statsData.currentStreak;
        if (totalTime) {
            const minutes = this.statsData.totalTime;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            totalTime.textContent = hours > 0 
                ? `${hours}h ${remainingMinutes}m` 
                : `${minutes}m`;
        }
        if (favoriteCountElem) favoriteCountElem.textContent = favoriteCount;
    }

    // Renderizar categorías
    renderCategories(unlocked, mensajes) {
        const categoriesGrid = document.getElementById("categoriesGrid");
        if (!categoriesGrid) return;
        
        // Contar por categoría
        const categories = {};
        const categoryIcons = {
            "Susurros":  "fa-feather",
            "Refugio":   "fa-heart",
            "Secretos":  "fa-fire",
            "Melodias":  "fa-music",
            "Aventuras": "fa-gamepad",
            "Universos": "fa-clapperboard",
            "Leyendas":  "fa-trophy",
            "Enigmas":   "fa-map",
            "Default":   "fa-heart"
        };

        const buildIconHTML = (category) => {
            const icon = categoryIcons[category] || categoryIcons["Default"];
            return `<i class="fas ${icon}"></i>`;
        };
        
        for (const [code, data] of Object.entries(mensajes)) {
            const category = data.categoria || "Otros";
            if (!categories[category]) {
                categories[category] = { total: 0, unlocked: 0 };
            }
            categories[category].total++;
            if (unlocked.has(code)) {
                categories[category].unlocked++;
            }
        }
        
        // Renderizar
        let html = "";
        for (const [category, stats] of Object.entries(categories)) {
            const iconHTML = buildIconHTML(category);
            const percentage = Math.round((stats.unlocked / stats.total) * 100);
            html += `
                <div class="category-card">
                    <div class="category-icon">${iconHTML}</div>
                    <div class="category-name">${category}</div>
                    <div class="category-count">${stats.unlocked}/${stats.total}</div>
                    <div class="category-percentage" style="font-size: 0.8em; color: var(--text-medium); margin-top: 0.3rem;">
                        ${percentage}%
                    </div>
                </div>
            `;
        }
        
        categoriesGrid.innerHTML = html;
    }

    // Renderizar logros
    renderAchievements(logros, achievedLogros, unlockedCount) {
        const achievementsGrid = document.getElementById("achievementsGrid");
        if (!achievementsGrid) return;
        
        let html = "";
        
        for (const logro of logros) {
            const isUnlocked = achievedLogros.has(logro.id);
            const progress = Math.min(unlockedCount, logro.codigo_requerido);
            const percentage = Math.round((progress / logro.codigo_requerido) * 100);
            
            html += `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon-wrapper">
                        <i class="fas ${isUnlocked ? 'fa-trophy' : 'fa-lock'}"></i>
                    </div>
                    <div class="achievement-info">
                        <div class="achievement-title">
                            ${isUnlocked ? logro.mensaje : '???'}
                        </div>
                        <div class="achievement-desc">
                            ${isUnlocked 
                                ? `¡Logro desbloqueado! Has descubierto ${logro.codigo_requerido} secretos.`
                                : `Desbloquea ${logro.codigo_requerido} secretos para revelar este logro.`
                            }
                        </div>
                        ${!isUnlocked ? `
                            <div class="achievement-requirement">
                                <i class="fas fa-chart-line"></i>
                                Progreso: ${progress}/${logro.codigo_requerido} (${percentage}%)
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        achievementsGrid.innerHTML = html;
    }

    // ===========================================
    // SALUDO DINÁMICO
    // ===========================================
    
    updateDynamicGreeting() {
        if (!this.elements.dynamicGreeting) return;
        
        const hour = new Date().getHours();
        let greeting = "";
        
        if (hour >= 6 && hour < 12) {
            greeting = "¡Buenos días, mi amor! ¿Listo para descubrir un nuevo secreto hoy?";
        } else if (hour >= 12 && hour < 20) {
            greeting = "Buenas tardes, cielo. Un pequeño código para alegrar tu tarde...";
        } else if (hour >= 20 && hour <= 23) {
            greeting = "Buenas noches, cariño. ¿Un último secreto antes de dormir?";
        } else {
            greeting = "Es tarde, descansa... pero sé que tu curiosidad no duerme.";
        }
        
        this.elements.dynamicGreeting.textContent = greeting;
    }

    // ===========================================
    // ORÁCULO DE HOY
    // ===========================================
    
    setupOracleModal() {
        if (this.elements.menuOracle) {
            this.elements.menuOracle.addEventListener("click", () => this.openOracleModal());
        }
        
        if (this.elements.closeOracleModal) {
            this.elements.closeOracleModal.addEventListener("click", () => this.closeOracleModal());
        }
        
        if (this.elements.oracleModal) {
            this.elements.oracleModal.addEventListener("click", (e) => {
                if (e.target === this.elements.oracleModal) {
                    this.closeOracleModal();
                }
            });
        }
    }

    openOracleModal() {
        if (!this.elements.oracleModal || !this.elements.oraclePhrase) return;
        
        // Cerrar menú desplegable
        if (this.elements.dropdownMenu) {
            this.elements.dropdownMenu.classList.remove("show");
        }
        
        // Verificar cooldown diario
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastOracleDate = localStorage.getItem("lastOracleDate");
        
        // Seleccionar frase aleatoria o recuperar la del día
        let phrase = "";
        let isNewPhrase = false;
        
        if (lastOracleDate === today) {
            // Ya usó el oráculo hoy - recuperar la frase guardada
            phrase = localStorage.getItem("todaysOraclePhrase") || this.oraclePhrases[0];
        } else {
            // Primera vez del día - nueva frase
            if (this.oraclePhrases.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.oraclePhrases.length);
                phrase = this.oraclePhrases[randomIndex];
                
                // Guardar fecha y frase del día
                localStorage.setItem("lastOracleDate", today);
                localStorage.setItem("todaysOraclePhrase", phrase);
                isNewPhrase = true;
                
                // Confetti especial solo para frase nueva
                this.triggerConfetti();
            }
        }
        
        // Mostrar frase con mensaje adicional
        this.elements.oraclePhrase.innerHTML = `
            <span class="oracle-phrase-text">${phrase}</span>
            <span class="oracle-return-message">
                ${isNewPhrase ? `${getSVGIcon('sparkles')} Esta es tu frase de hoy` : `${getSVGIcon('moon')} Vuelve mañana para un nuevo mensaje`}
            </span>
        `;
        
        this.elements.oracleModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    closeOracleModal() {
        if (!this.elements.oracleModal) return;
        this.elements.oracleModal.classList.remove("show");
        document.body.style.overflow = "";
    }

    // ===========================================
    // MODO LECTURA ENVOLVENTE
    // ===========================================
    
    setupReadingMode() {
        if (this.elements.exitReadingMode) {
            this.elements.exitReadingMode.addEventListener("click", () => this.closeReadingMode());
        }
        
        if (this.elements.readingModeModal) {
            this.elements.readingModeModal.addEventListener("click", (e) => {
                if (e.target === this.elements.readingModeModal) {
                    this.closeReadingMode();
                }
            });
        }
    }

    openReadingMode(text) {
        if (!this.elements.readingModeModal || !this.elements.readingModeText) return;
        
        this.elements.readingModeText.textContent = text;
        this.elements.readingModeModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    closeReadingMode() {
        if (!this.elements.readingModeModal) return;
        this.elements.readingModeModal.classList.remove("show");
        document.body.style.overflow = "";
    }

    // Modificar renderContent para incluir botón de modo lectura si el texto es largo
    addReadingModeButton(text) {
        if (text.length > 300) {
            const btn = document.createElement("button");
            btn.className = "expand-reading-btn";
            btn.innerHTML = '<i class="fas fa-expand"></i>';
            btn.title = "Modo lectura";
            btn.onclick = () => this.openReadingMode(text);
            return btn;
        }
        return null;
    }

    // ===========================================
    // MÓDULO DE BUZÓN (CORREO INTERNO)
    // ===========================================
    
    setupMailboxModal() {
        if (this.elements.menuMailbox) {
            this.elements.menuMailbox.addEventListener("click", () => this.openMailboxModal());
        }
        
        if (this.elements.closeMailboxModal) {
            this.elements.closeMailboxModal.addEventListener("click", () => this.closeMailboxModal());
        }
        
        if (this.elements.mailboxModal) {
            this.elements.mailboxModal.addEventListener("click", (e) => {
                if (e.target === this.elements.mailboxModal) {
                    this.closeMailboxModal();
                }
            });
        }
    }

    async checkMailboxNotifications() {
        try {
            // Verificación ligera para mostrar badge
            const response = await fetch('./emails.json');
            if (!response.ok) return;
            
            const data = await response.json();
            const totalEmails = data.emails.length;
            const unreadCount = totalEmails - this.readEmails.size;
            
            this.updateMailboxBadge(unreadCount);
        } catch (error) {
            console.warn("No se pudo verificar el buzón:", error);
        }
    }

    async loadEmailsData() {
        if (this.emailsLoaded) return this.emailsData;
        
        try {
            const response = await fetch('./emails.json');
            if (!response.ok) throw new Error("No se pudo cargar emails.json");
            
            this.emailsData = await response.json();
            this.emailsLoaded = true;
            return this.emailsData;
        } catch (error) {
            console.error("Error cargando emails:", error);
            return null;
        }
    }

    async openMailboxModal() {
        if (!this.elements.mailboxModal) return;
        
        // Cerrar menú desplegable
        if (this.elements.dropdownMenu) {
            this.elements.dropdownMenu.classList.remove("show");
        }
        
        // Cargar datos si aún no están cargados
        if (!this.emailsLoaded) {
            const data = await this.loadEmailsData();
            if (!data) {
                this.showToast(`${getSVGIcon('error', 'icon-error-color')} Error al cargar el buzón`);
                return;
            }
        }
        
        // Mostrar modal
        this.elements.mailboxModal.classList.add("show");
        document.body.style.overflow = "hidden";
        
        // Renderizar lista de correos
        this.renderMailboxList();
    }

    closeMailboxModal() {
        if (!this.elements.mailboxModal) return;
        this.elements.mailboxModal.classList.remove("show");
        document.body.style.overflow = "";
        
        // Limpiar visor
        if (this.elements.mailViewer) {
            this.elements.mailViewer.innerHTML = "";
            this.elements.mailViewer.classList.remove("show");
        }
    }

    renderMailboxList() {
        if (!this.elements.mailboxList || !this.emailsData) return;
        
        const emails = this.emailsData.emails || [];
        
        let html = "";
        for (const email of emails) {
            const isUnread = !this.readEmails.has(email.id);
            const unreadClass = isUnread ? 'unread' : '';
            
            html += `
                <div class="mail-item ${unreadClass}" data-mail-id="${email.id}">
                    <div class="mail-item-header">
                        <span class="mail-sender">${email.sender}</span>
                        <span class="mail-date">${this.formatDate(email.date)}</span>
                    </div>
                    <div class="mail-subject">${email.subject}</div>
                    <div class="mail-preview">${email.preview}</div>
                    ${isUnread ? '<div class="mail-unread-indicator"></div>' : ''}
                </div>
            `;
        }
        
        this.elements.mailboxList.innerHTML = html;
        
        // Agregar event listeners
        const mailItems = this.elements.mailboxList.querySelectorAll('.mail-item');
        mailItems.forEach(item => {
            item.addEventListener('click', () => {
                const mailId = item.getAttribute('data-mail-id');
                this.renderEmailViewer(mailId);
            });
        });
    }

    renderEmailViewer(emailId) {
        if (!this.elements.mailViewer || !this.emailsData) return;
        
        const email = this.emailsData.emails.find(e => e.id === emailId);
        if (!email) return;
        
        // Marcar como leído
        this.markEmailAsRead(emailId);
        
        // Renderizar contenido del email
        let html = `
            <div class="mail-viewer-header">
                <button class="mail-back-btn" id="mailBackBtn">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            <div class="mail-viewer-content">
                <div class="mail-viewer-meta">
                    <div class="mail-viewer-subject">${email.subject}</div>
                    <div class="mail-viewer-info">
                        <span><i class="fas fa-user"></i> ${email.sender}</span>
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(email.date)}</span>
                    </div>
                </div>
                <div class="mail-viewer-body">${email.body.replace(/\n/g, '<br>')}</div>
        `;
        
        // Renderizar adjuntos si existen
        if (email.attachments && email.attachments.length > 0) {
            html += `<div class="mail-attachments">`;
            html += `<div class="mail-attachments-title"><i class="fas fa-paperclip"></i> Archivos adjuntos (${email.attachments.length})</div>`;
            html += `<div class="mail-attachments-grid">`;
            
            for (const attachment of email.attachments) {
                const isEncrypted = attachment.type.includes('encrypted');
                const icon = this.getAttachmentIcon(attachment);
                
                html += `
                    <div class="mail-attachment-card" data-attachment='${JSON.stringify(attachment)}'>
                        <div class="attachment-icon">
                            <i class="fas ${icon}"></i>
                            ${isEncrypted ? '<i class="fas fa-lock attachment-lock"></i>' : ''}
                        </div>
                        <div class="attachment-name">${attachment.name}</div>
                        <div class="attachment-progress" style="display: none;">
                            <div class="attachment-progress-bar"></div>
                            <div class="attachment-progress-text">0%</div>
                        </div>
                    </div>
                `;
            }
            
            html += `</div></div>`;
        }
        
        html += `</div>`;
        
        this.elements.mailViewer.innerHTML = html;
        this.elements.mailViewer.classList.add("show");
        
        // Event listener para botón de volver
        const backBtn = document.getElementById('mailBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.elements.mailViewer.classList.remove("show");
            });
        }
        
        // Event listeners para adjuntos
        const attachmentCards = this.elements.mailViewer.querySelectorAll('.mail-attachment-card');
        attachmentCards.forEach(card => {
            card.addEventListener('click', () => {
                const attachmentData = JSON.parse(card.getAttribute('data-attachment'));
                this.handleAttachmentClick(attachmentData, card);
            });
        });
    }

    getAttachmentIcon(attachment) {
        if (attachment.type.includes('image')) return 'fa-image';
        if (attachment.type.includes('pdf')) return 'fa-file-pdf';
        if (attachment.type === 'file') {
            const ext = attachment.name.split('.').pop().toLowerCase();
            if (['pdf'].includes(ext)) return 'fa-file-pdf';
            if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
            if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel';
        }
        return 'fa-file';
    }

    async handleAttachmentClick(attachment, cardElement) {
        const isEncrypted = attachment.type.includes('encrypted');
        
        if (isEncrypted) {
            // Mostrar input de contraseña con icono SVG
            const lockIconText = '🔒'; // Usaremos el emoji en el prompt nativo ya que no podemos renderizar SVG en prompt()
            const password = prompt(`${lockIconText} Este archivo está protegido.\n\nArchivo: ${attachment.name}\n\nIngresa la contraseña:`);
            
            if (!password) return;
            
            // Mostrar barra de progreso
            const progressDiv = cardElement.querySelector('.attachment-progress');
            const progressBar = cardElement.querySelector('.attachment-progress-bar');
            const progressText = cardElement.querySelector('.attachment-progress-text');
            
            if (progressDiv) {
                progressDiv.style.display = 'block';
            }
            
            try {
                const blob = await descifrarArchivo(
                    attachment.url,
                    attachment.name,
                    password,
                    (percent, statusText) => {
                        if (progressBar) progressBar.style.width = `${percent}%`;
                        if (progressText) progressText.textContent = percent < 100 ? `${percent}%` : 'Abriendo...';
                    }
                );
                
                if (blob) {
                    this.showToast(`${getSVGIcon('success', 'icon-success-color')} Archivo desbloqueado`);
                    this.triggerConfetti();
                    
                    // Ocultar barra de progreso
                    if (progressDiv) progressDiv.style.display = 'none';
                    
                    // Abrir el archivo según su tipo
                    const cleanName = attachment.name.replace(/\.(wenc|enc)$/i, "");
                    
                    if (attachment.type.includes('image')) {
                        this.renderMediaModal(blob, cleanName);
                    } else {
                        // Forzar descarga
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = cleanName;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    }
                } else {
                    if (progressDiv) progressDiv.style.display = 'none';
                    alert("❌ Contraseña incorrecta");
                }
            } catch (error) {
                if (progressDiv) progressDiv.style.display = 'none';
                console.error("Error descifrando:", error);
                alert("❌ Error al descifrar el archivo");
            }
        } else {
            // Archivo no encriptado - descarga directa o vista
            if (attachment.type.includes('image')) {
                window.open(attachment.url, '_blank');
            } else {
                const a = document.createElement("a");
                a.href = attachment.url;
                a.download = attachment.name;
                a.click();
            }
        }
    }

    markEmailAsRead(emailId) {
        if (!this.readEmails.has(emailId)) {
            this.readEmails.add(emailId);
            localStorage.setItem("readEmails", JSON.stringify([...this.readEmails]));
            
            // Actualizar badge
            const totalEmails = this.emailsData ? this.emailsData.emails.length : 0;
            const unreadCount = totalEmails - this.readEmails.size;
            this.updateMailboxBadge(unreadCount);
            
            // Actualizar la lista visual
            this.renderMailboxList();
        }
    }

    updateMailboxBadge(unreadCount) {
        // Badge en el botón del menú
        if (this.elements.mailboxBadge) {
            if (unreadCount > 0) {
                this.elements.mailboxBadge.textContent = unreadCount;
                this.elements.mailboxBadge.style.display = 'flex';
            } else {
                this.elements.mailboxBadge.style.display = 'none';
            }
        }
        
        // Badge en el icono del menú hamburguesa
        if (this.elements.menuBadge) {
            if (unreadCount > 0) {
                this.elements.menuBadge.style.display = 'block';
            } else {
                this.elements.menuBadge.style.display = 'none';
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }
}
