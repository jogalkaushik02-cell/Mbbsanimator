// ============================================
// Video Recorder - Capture & Download
// Supports WebM (Chrome/Firefox) and MP4 (Safari)
// ============================================

const VideoRecorder = {
    mediaRecorder: null,
    chunks: [],
    isRecording: false,
    stream: null,
    startTime: 0,
    mimeType: "",

    async startRecording(canvasElement) {
        try {
            this.stream = canvasElement.captureStream(30);
            this.startTime = Date.now();
            this.mimeType = this.getBestMimeType();

            // Try to capture voice narration
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const dest = audioCtx.createMediaStreamDestination();
                const speakers = audioCtx.createMediaStreamDestination();
                this.stream.getAudioTracks().forEach(t => speakers.addTrack(t));
            } catch (e) {}

            const options = { videoBitsPerSecond: 5000000 };
            if (this.mimeType) options.mimeType = this.mimeType;

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.saveVideo();
            };

            this.mediaRecorder.start(100);
            this.isRecording = true;

            return { success: true, mimeType: this.mimeType };
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
        const ext = this.mimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(this.chunks, { type: this.mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
        const m = Math.floor(duration / 60);
        const s = duration % 60;

        const a = document.createElement("a");
        a.href = url;
        a.download = "medanimate-" + Date.now() + "." + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 10000);

        return {
            size: blob.size,
            sizeMB,
            duration: m + ":" + String(s).padStart(2, "0"),
            filename: a.download
        };
    },

    takeScreenshot(canvasElement) {
        const dataURL = canvasElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "medanimate-" + Date.now() + ".png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
    },

    getBestMimeType() {
        // Try MP4 first (plays on everything - Android, iOS, Windows)
        const mp4Types = [
            "video/mp4",
            "video/mp4;codecs=avc1",
            "video/mp4;codecs=avc1.42E01E"
        ];
        for (const type of mp4Types) {
            if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        // Fallback to WebM VP8 (widely supported)
        const webmTypes = [
            "video/webm;codecs=vp8,opus",
            "video/webm;codecs=vp8",
            "video/webm"
        ];
        for (const type of webmTypes) {
            if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return "";
    },

    getRecordingDuration() {
        if (!this.isRecording || !this.startTime) return "0:00";
        const sec = Math.floor((Date.now() - this.startTime) / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m + ":" + String(s).padStart(2, "0");
    },

    getEstimatedSize() {
        if (!this.isRecording || !this.startTime) return "0 MB";
        const sec = (Date.now() - this.startTime) / 1000;
        const mb = (sec * 0.5).toFixed(1);
        return "~" + mb + " MB";
    }
};
