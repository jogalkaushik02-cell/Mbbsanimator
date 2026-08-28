// ============================================
// Video Recorder & Screenshot - Capture canvas
// Works on Android + iOS Safari
// ============================================

const VideoRecorder = {
    mediaRecorder: null,
    chunks: [],
    isRecording: false,
    stream: null,
    startTime: 0,

    async startRecording(canvasElement) {
        try {
            this.stream = canvasElement.captureStream(30);
            this.startTime = Date.now();

            // Try to capture voice narration audio
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const dest = audioCtx.createMediaStreamDestination();
                const source = audioCtx.createMediaElementSource(document.createElement("audio"));
                source.connect(dest);
                if (dest.stream.getAudioTracks().length > 0) {
                    this.stream.addTrack(dest.stream.getAudioTracks()[0]);
                }
            } catch (e) {
                // Audio not available, record video only
            }

            const mimeType = this.getBestMimeType();

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000
            });

            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.saveVideo();
            };

            this.mediaRecorder.start(100);
            this.isRecording = true;

            return { success: true, mimeType };
        } catch (err) {
            console.error("Recording failed:", err);
            return { success: false, error: err.message };
        }
    },

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            return true;
        }
        return false;
    },

    saveVideo() {
        const blob = new Blob(this.chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);

        const a = document.createElement("a");
        a.href = url;
        a.download = `medanimate-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 10000);

        return { size: blob.size, sizeMB, duration, filename: a.download };
    },

    // Take a screenshot of the canvas
    takeScreenshot(canvasElement) {
        const dataURL = canvasElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `medanimate-screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
    },

    getBestMimeType() {
        const types = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm",
            "video/mp4",
            "video/ogg"
        ];
        for (const type of types) {
            if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return "video/webm";
    },

    getRecordingDuration() {
        if (!this.isRecording || !this.startTime) return "0:00";
        const sec = Math.floor((Date.now() - this.startTime) / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    },

    getEstimatedSize() {
        if (!this.isRecording || !this.startTime) return "0 MB";
        const sec = (Date.now() - this.startTime) / 1000;
        const mb = (sec * 0.5).toFixed(1);
        return `~${mb} MB`;
    }
};
