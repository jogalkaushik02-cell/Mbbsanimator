// ============================================
// Voice Manager - MALE VOICE, proper pitch
// Web Speech API with male voice selection
// ============================================

const VoiceManager = {
    synthesis: window.speechSynthesis || null,
    enabled: true,
    voice: null,
    isSpeaking: false,

    init() {
        if (!this.synthesis) return;

        const loadVoices = () => {
            const voices = this.synthesis.getVoices();
            // Find MALE English voices first
            const maleNames = ["daniel", "james", "john", "david", "mark", "alex", "matt", "ryan", "jack", "oliver", "google uk english male", "google us english", "microsoft david", "microsoft mark", "microsoft james"];
            const englishVoices = voices.filter(v => v.lang.startsWith("en"));

            // Try to find a male voice
            this.voice = englishVoices.find(v => {
                const name = v.name.toLowerCase();
                return maleNames.some(m => name.includes(m));
            });

            // Fallback: just use any English voice
            if (!this.voice) {
                this.voice = englishVoices[0] || voices[0] || null;
            }
        };

        loadVoices();
        this.synthesis.onvoiceschanged = loadVoices;
    },

    speak(text) {
        if (!this.enabled || !this.synthesis || !text) return;
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 0.85;   // Slightly slower for clarity
        utterance.pitch = 0.8;   // LOWER pitch = male sounding
        utterance.volume = 0.9;

        utterance.onstart = () => { this.isSpeaking = true; };
        utterance.onend = () => { this.isSpeaking = false; };
        utterance.onerror = () => { this.isSpeaking = false; };

        this.synthesis.speak(utterance);
    },

    stop() { if (this.synthesis) this.synthesis.cancel(); this.isSpeaking = false; },

    toggle() { this.enabled = !this.enabled; if (!this.enabled) this.stop(); return this.enabled; },

    playBeep(freq = 440, dur = 0.1) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = freq; osc.type = "sine"; gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.stop(ctx.currentTime + dur);
        } catch (e) {}
    },

    playClickSound() { this.playBeep(880, 0.05); },
    playStepSound() { this.playBeep(660, 0.08); },
    playCorrectSound() { this.playBeep(880, 0.1); setTimeout(() => this.playBeep(1100, 0.15), 100); },
    playWrongSound() { this.playBeep(300, 0.2); }
};
