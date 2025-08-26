// Enhanced Audio Manager with Modern Futuristic Sound Effects
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
        this.currentBackgroundMusic = null;
        this.voiceOutput = null;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create all sound effects
            this.createSounds();
            
            // Resume audio context on user interaction
            document.addEventListener('click', () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }, { once: true });
            
            this.initialized = true;
            console.log('Audio Manager initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }
    
    createSounds() {
        // Define sound parameters with futuristic themes
        const soundConfigs = {
            // Add these new sounds to the soundConfigs object:
        // Tech/Space Sounds
        woosh: { 
            frequency: [200, 400, 600, 800, 600, 400, 200], 
            duration: 0.4, 
            type: 'sine',
            volume: 0.3,
            description: 'Woosh transition'
        },
        tada: { 
            frequency: [523, 587, 659, 698, 784, 880, 988, 1047], 
            duration: 0.8, 
            type: 'sine',
            volume: 0.4,
            description: 'Achievement sound'
        },
        spaceCrash: { 
            frequency: 'noise', 
            duration: 0.6, 
            filterFreq: 300,
            volume: 0.4,
            description: 'Space collision'
        },
        techBeep: { 
            frequency: [800, 1000, 1200, 1000, 800], 
            duration: 0.3, 
            type: 'square',
            volume: 0.2,
            description: 'Tech interface beep'
        },
        quantumPulse: { 
            frequency: [100, 200, 400, 800, 400, 200, 100], 
            duration: 0.5, 
            type: 'sawtooth',
            volume: 0.25,
            description: 'Quantum effect'
        },
            // Page/Navigation Sounds
         /*   landingPageLoad: { 
                frequency: [100, 200, 400, 600, 800, 1000], 
                duration: 1.5, 
                type: 'sine',
                volume: 0.3,
                description: 'Futuristic welcome'
            },
            mainPageLoad: { 
                frequency: [261, 329, 392, 523, 659], 
                duration: 1.0, 
                type: 'sine',
                volume: 0.3,
                description: 'Portfolio entry'
            },*/
            pageTransition: { 
                frequency: [400, 500, 600, 700], 
                duration: 0.5, 
                type: 'sine',
                volume: 0.2 
            },
            
            // UI Interaction Sounds
            buttonClick: { 
                frequency: [800, 1000], 
                duration: 0.08, 
                type: 'square',
                volume: 0.2 
            },
            navClick: { 
                frequency: [600, 900], 
                duration: 0.1, 
                type: 'sine',
                volume: 0.2 
            },
            hover: { 
                frequency: 500, 
                duration: 0.03, 
                type: 'sine',
                volume: 0.1 
            },
            toggle: { 
                frequency: [400, 800], 
                duration: 0.15, 
                type: 'square',
                volume: 0.2 
            },
            tabSwitch: { 
                frequency: [500, 700, 900], 
                duration: 0.2, 
                type: 'sine',
                volume: 0.2 
            },
            
            // Chatbot Sounds
            chatOpen: { 
                frequency: [300, 500, 700, 900], 
                duration: 0.3, 
                type: 'sine',
                volume: 0.25 
            },
            chatClose: { 
                frequency: [900, 700, 500, 300], 
                duration: 0.3, 
                type: 'sine',
                volume: 0.25 
            },
            messageSent: { 
                frequency: [700, 900], 
                duration: 0.1, 
                type: 'sine',
                volume: 0.2 
            },
            messageReceived: { 
                frequency: [600, 800], 
                duration: 0.12, 
                type: 'sine',
                volume: 0.2 
            },
            voiceStart: { 
                frequency: [400, 600, 800], 
                duration: 0.2, 
                type: 'sine',
                volume: 0.3 
            },
            voiceStop: { 
                frequency: [800, 600, 400], 
                duration: 0.2, 
                type: 'sine',
                volume: 0.3 
            },
            
            // Modal/Popup Sounds
            modalOpen: { 
                frequency: [400, 500, 600, 700], 
                duration: 0.25, 
                type: 'sine',
                volume: 0.2 
            },
            modalClose: { 
                frequency: [700, 600, 500, 400], 
                duration: 0.25, 
                type: 'sine',
                volume: 0.2 
            },
            escapeKey: { 
                frequency: [500, 300], 
                duration: 0.15, 
                type: 'square',
                volume: 0.2 
            },
            
            // Success/Error/Notification Sounds
            success: { 
                frequency: [523, 659, 784, 1047], 
                duration: 0.4, 
                type: 'sine',
                volume: 0.3 
            },
            error: { 
                frequency: [300, 200, 150], 
                duration: 0.4, 
                type: 'sawtooth',
                volume: 0.3 
            },
            notification: { 
                frequency: [800, 1000, 800], 
                duration: 0.3, 
                type: 'sine',
                volume: 0.25 
            },
            warning: { 
                frequency: [400, 350, 400, 350], 
                duration: 0.5, 
                type: 'square',
                volume: 0.25 
            },
            
            // Form/Input Sounds
            typing: { 
                frequency: 1200, 
                duration: 0.02, 
                type: 'sine',
                volume: 0.05 
            },
            formSubmit: { 
                frequency: [600, 800, 1000], 
                duration: 0.3, 
                type: 'sine',
                volume: 0.25 
            },
            inputFocus: { 
                frequency: 700, 
                duration: 0.05, 
                type: 'sine',
                volume: 0.1 
            },
            
            // Download/Upload Sounds
            downloadStart: { 
                frequency: [400, 600, 800], 
                duration: 0.3, 
                type: 'sine',
                volume: 0.25 
            },
            downloadComplete: { 
                frequency: [600, 800, 1000, 1200], 
                duration: 0.5, 
                type: 'sine',
                volume: 0.3 
            },
            
            // Game Menu/Navigation
            gameMenuOpen: { 
                frequency: [300, 400, 500, 600, 700], 
                duration: 0.4, 
                type: 'sine',
                volume: 0.3 
            },
            gameSelect: { 
                frequency: [500, 700, 900], 
                duration: 0.2, 
                type: 'square',
                volume: 0.25 
            },
            
            // Modern Game Sound Effects
            
            // General Game Sounds
            gameStart: { 
                frequency: [261, 329, 392, 523, 659, 784], 
                duration: 0.8, 
                type: 'sine',
                volume: 0.4,
                description: 'Futuristic game start'
            },
            gamePause: { 
                frequency: [600, 400], 
                duration: 0.3, 
                type: 'square',
                volume: 0.3 
            },
            gameResume: { 
                frequency: [400, 600], 
                duration: 0.3, 
                type: 'square',
                volume: 0.3 
            },
            
            // Player Actions
            playerShoot: { 
                frequency: [1500, 800, 400], 
                duration: 0.15, 
                type: 'sawtooth',
                volume: 0.3,
                description: 'Futuristic laser'
            },
            playerJump: { 
                frequency: [200, 400, 600], 
                duration: 0.2, 
                type: 'sine',
                volume: 0.25 
            },
            playerMove: { 
                frequency: 150, 
                duration: 0.05, 
                type: 'square',
                volume: 0.1 
            },
            playerHit: { 
                frequency: [200, 150, 100, 50], 
                duration: 0.4, 
                type: 'sawtooth',
                volume: 0.35 
            },
            playerShield: { 
                frequency: [400, 500, 600, 500, 400], 
                duration: 0.5, 
                type: 'sine',
                volume: 0.3 
            },
            
            // Enemy/Opponent Actions
            enemyShoot: { 
                frequency: [600, 400, 200], 
                duration: 0.12, 
                type: 'square',
                volume: 0.25 
            },
            enemyDestroyed: { 
                frequency: 'noise', 
                duration: 0.3, 
                filterFreq: 500,
                volume: 0.3 
            },
            enemySpawn: { 
                frequency: [200, 300, 400], 
                duration: 0.25, 
                type: 'sawtooth',
                volume: 0.2 
            },
            
            // Collectibles/Power-ups
            collectItem: { 
                frequency: [800, 1000, 1200, 1400], 
                duration: 0.3, 
                type: 'sine',
                volume: 0.3 
            },
            powerUp: { 
                frequency: [400, 500, 600, 700, 800, 900, 1000], 
                duration: 0.6, 
                type: 'sine',
                volume: 0.35 
            },
            bonusPoints: { 
                frequency: [1000, 1200, 1400, 1600], 
                duration: 0.4, 
                type: 'sine',
                volume: 0.3 
            },
            
            // Explosions/Impacts
            explosion: { 
                frequency: 'noise', 
                duration: 0.5, 
                filterFreq: 200,
                volume: 0.4 
            },
            smallExplosion: { 
                frequency: 'noise', 
                duration: 0.25, 
                filterFreq: 400,
                volume: 0.3 
            },
            impact: { 
                frequency: [100, 50], 
                duration: 0.2, 
                type: 'sawtooth',
                volume: 0.35 
            },
            
            // Level/Progress Sounds
            levelUp: { 
                frequency: [400, 500, 600, 700, 800, 1000, 1200], 
                duration: 0.8, 
                type: 'sine',
                volume: 0.4 
            },
            levelComplete: { 
                frequency: [523, 659, 784, 1047, 1319, 1568], 
                duration: 1.0, 
                type: 'sine',
                volume: 0.4 
            },
            checkpoint: { 
                frequency: [600, 800, 1000], 
                duration: 0.4, 
                type: 'sine',
                volume: 0.3 
            },
            
            // Game Over/Victory
            gameOver: { 
                frequency: [400, 350, 300, 250, 200, 150, 100], 
                duration: 1.5, 
                type: 'sawtooth',
                volume: 0.4 
            },
            gameWin: { 
                frequency: [523, 587, 659, 698, 784, 880, 988, 1047], 
                duration: 2.0, 
                type: 'sine',
                volume: 0.45,
                description: 'Victory fanfare'
            },
            
            // Minesweeper Specific
            mineReveal: { 
                frequency: 'noise', 
                duration: 0.8, 
                filterFreq: 150,
                volume: 0.4 
            },
            flagPlace: { 
                frequency: [500, 700], 
                duration: 0.15, 
                type: 'square',
                volume: 0.2 
            },
            tileReveal: { 
                frequency: 600, 
                duration: 0.08, 
                type: 'sine',
                volume: 0.15 
            },
            
            // Block Shooter Specific
            blockBreak: { 
                frequency: [800, 600, 400], 
                duration: 0.2, 
                type: 'square',
                volume: 0.25 
            },
            ballBounce: { 
                frequency: 1000, 
                duration: 0.05, 
                type: 'sine',
                volume: 0.2 
            },
            paddleHit: { 
                frequency: 700, 
                duration: 0.08, 
                type: 'square',
                volume: 0.2 
            },
            
            // Ambient/Background
            ambientSpace: { 
                frequency: [55, 110], 
                duration: 'continuous', 
                type: 'sine',
                volume: 0.05 
            }
        };
        
        // Store configurations
        Object.keys(soundConfigs).forEach(soundName => {
            this.sounds[soundName] = soundConfigs[soundName];
        });
    }
    
    playSound(soundName, customVolume = null) {
        if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
        
        const config = this.sounds[soundName];
        const volume = customVolume !== null ? customVolume : (config.volume || this.volume);
        
        if (config.frequency === 'noise') {
            this.playNoise(config, volume);
        } else if (config.duration === 'continuous') {
            return this.playAmbient(config, volume);
        } else {
            this.playTone(config, volume);
        }
    }
    
    playTone(config, volume) {
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = config.type;
        
        // Handle frequency arrays for complex sounds
        if (Array.isArray(config.frequency)) {
            const timeSlice = config.duration / config.frequency.length;
            config.frequency.forEach((freq, index) => {
                oscillator.frequency.setValueAtTime(freq, now + index * timeSlice);
            });
        } else {
            oscillator.frequency.value = config.frequency;
        }
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
        
        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }
    
    playNoise(config, volume) {
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * config.duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = buffer;
        
        // Filter for different explosion types
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = config.filterFreq || 200;
        
        const gainNode = this.audioContext.createGain();
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Explosion envelope
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
        
        whiteNoise.start(now);
        whiteNoise.stop(now + config.duration);
    }
    
    playAmbient(config, volume) {
        if (this.currentBackgroundMusic) {
            this.stopAmbient();
        }
        
        const oscillators = [];
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.audioContext.destination);
        gainNode.gain.value = volume;
        
        config.frequency.forEach(freq => {
            const osc = this.audioContext.createOscillator();
            osc.type = config.type;
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start();
            oscillators.push(osc);
        });
        
        this.currentBackgroundMusic = { oscillators, gainNode };
        return this.currentBackgroundMusic;
    }
    
    stopAmbient() {
        if (this.currentBackgroundMusic) {
            this.currentBackgroundMusic.oscillators.forEach(osc => osc.stop());
            this.currentBackgroundMusic.gainNode.disconnect();
            this.currentBackgroundMusic = null;
        }
    }
    
    // Voice synthesis for chatbot
    speakText(text, options = {}) {
        if (!window.speechSynthesis) return;
        
        // Stop any ongoing speech
        this.stopSpeaking();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || this.volume;
        utterance.voice = options.voice || this.getVoice();
        
        // Play start sound
        this.playSound('voiceStart');
        
        utterance.onend = () => {
            this.playSound('voiceStop');
            this.voiceOutput = null;
        };
        
        this.voiceOutput = utterance;
        window.speechSynthesis.speak(utterance);
    }
    
    stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            if (this.voiceOutput) {
                this.playSound('voiceStop');
                this.voiceOutput = null;
            }
        }
    }
    
    getVoice() {
        const voices = window.speechSynthesis.getVoices();
        // Prefer a robotic/tech voice if available
        return voices.find(v => v.name.includes('Google') || v.name.includes('Microsoft')) || voices[0];
    }
    
    // Add custom greeting based on time
    getGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour >= 5 && hour < 12) {
            greeting = 'Good morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good afternoon';
        } else if (hour >= 17 && hour < 22) {
            greeting = 'Good evening';
        } else {
            greeting = 'Hello';
        }
        
        return `${greeting}! This is Sai's AI Twin.`;
    }
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAmbient();
            this.stopSpeaking();
        }
    }
    
    // Attach hover sounds to elements
    attachHoverSounds(selector = '.btn, .nav-link, .social-link, button') {
        document.querySelectorAll(selector).forEach(element => {
            element.addEventListener('mouseenter', () => this.playSound('hover'));
        });
    }
    
    // Attach click sounds to elements
    attachClickSounds(selector = 'button, .btn, a') {
        document.querySelectorAll(selector).forEach(element => {
            element.addEventListener('click', () => {
                if (element.classList.contains('nav-link')) {
                    this.playSound('navClick');
                } else {
                    this.playSound('buttonClick');
                }
            });
        });
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.audioManager.init();
    
    // Play landing page sound: SPACE COLLISION (~2–3 seconds total)
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setTimeout(() => {
            // Repeat 'spaceCrash' (~0.6s each)
            const repeats = 55;
            const intervalMs = 600;
            for (let i = 0; i < repeats; i++) {
                setTimeout(() => {
                    window.audioManager.playSound('spaceCrash');
                }, i * intervalMs);
            }
        }, 500);
    }
    
    // Play main page sound: WOOSH transition
    if (window.location.pathname.includes('main.html')) {
        setTimeout(() => {
            window.audioManager.playSound('woosh');
        }, 500);
    }
    
    // Attach sounds to UI elements
    setTimeout(() => {
        window.audioManager.attachHoverSounds();
        window.audioManager.attachClickSounds();
    }, 1000);
});
