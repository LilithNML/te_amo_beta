/**
 * modules/backgroundEngine.js
 * Sistema de partículas dinámico basado en hora del día
 */

export class BackgroundEngine {
    constructor() {
        this.currentPeriod = null;
        this.init();
    }

    init() {
        this.updateParticles();
        // Verificar cada 30 minutos si cambió el período
        setInterval(() => this.updateParticles(), 1800000);
    }

    getCurrentPeriod() {
        const hour = new Date().getHours();
        
        if (hour >= 6 && hour < 18) {
            return 'day';
        } else {
            return 'night';
        }
    }

    async updateParticles() {
        const period = this.getCurrentPeriod();
        
        // Solo actualizar si cambió el período
        if (period === this.currentPeriod) return;
        
        this.currentPeriod = period;
        await this.loadParticles(period);
    }

    async loadParticles(period) {
        // @ts-ignore
        if (typeof tsParticles === 'undefined') return;

        const configs = {
            day: {
                particles: {
                    number: { value: 40, density: { enable: true, area: 800 } },
                    color: { value: ["#ffffff", "#ffd700", "#ffeb3b"] },
                    shape: { type: "circle" },
                    opacity: { 
                        value: 0.6, 
                        random: true, 
                        animation: { 
                            enable: true, 
                            speed: 0.8, 
                            minimumValue: 0.2 
                        } 
                    },
                    size: { 
                        value: 2.5, 
                        random: true, 
                        animation: { 
                            enable: true, 
                            speed: 1.5,
                            minimumValue: 1
                        } 
                    },
                    move: { 
                        enable: true, 
                        speed: 0.4, 
                        direction: "none", 
                        random: true, 
                        straight: false,
                        outModes: "out" 
                    }
                },
                interactivity: { 
                    events: { 
                        onHover: { enable: true, mode: "bubble" }, 
                        onClick: { enable: true, mode: "repulse" } 
                    },
                    modes: {
                        bubble: { distance: 100, size: 4, duration: 2 },
                        repulse: { distance: 100, duration: 0.4 }
                    }
                }
            },
            night: {
                particles: {
                    number: { value: 60, density: { enable: true, area: 800 } },
                    color: { value: ["#ffffff", "#a8dadc", "#457b9d"] },
                    shape: { type: "star" },
                    opacity: { 
                        value: 0.8, 
                        random: true, 
                        animation: { 
                            enable: true, 
                            speed: 0.5, 
                            minimumValue: 0.3,
                            sync: false
                        } 
                    },
                    size: { 
                        value: 2, 
                        random: { enable: true, minimumValue: 1 }
                    },
                    move: { 
                        enable: true, 
                        speed: 0.2, 
                        direction: "none", 
                        random: true,
                        straight: false,
                        outModes: "out" 
                    },
                    twinkle: {
                        particles: {
                            enable: true,
                            frequency: 0.05,
                            opacity: 1
                        }
                    }
                },
                interactivity: { 
                    events: { 
                        onHover: { enable: true, mode: "grab" }, 
                        onClick: { enable: true, mode: "push" } 
                    },
                    modes: {
                        grab: { distance: 150, links: { opacity: 0.5 } },
                        push: { quantity: 4 }
                    }
                }
            }
        };

        const config = configs[period];
        
        // @ts-ignore
        await tsParticles.load('tsparticles', {
            fpsLimit: 60,
            fullScreen: { enable: false, zIndex: 0 }, // Cambiado a 0 para que sea visible pero detrás del contenido
            particles: config.particles,
            interactivity: config.interactivity,
            detectRetina: true,
            background: {
                color: "transparent"
            }
        });
    }

    destroy() {
        // @ts-ignore
        if (typeof tsParticles !== 'undefined') {
            // @ts-ignore
            tsParticles.domItem(0)?.destroy();
        }
    }
}
