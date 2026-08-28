// ============================================
// Video Recorder - Capture & Download as WebM
// Works on Android + iOS Safari
// ============================================

const VideoRecorder = {
    mediaRecorder: null,
    chunks: [],
    isRecording: false,
    stream: null,
    audioStream: null,

    // Start recording the 3D canvas + voice
    async startRecording(canvasElement) {
        try {
            // Capture canvas video stream
            this.stream = canvasElement.captureStream(30); // 30 FPS

            // Try to capture system audio (voice narration)
            try {
                const audioCtx = new AudioContext();
                const dest = audioCtx.createMediaStreamDestination();
                // Connect system audio if available
                this.stream.addTrack(dest.stream.getAudioTracks()[0] || new MediaStreamTrack());
            } catch (e) {
                // Audio capture not supported, record video only
                console.log("Audio capture not available, recording video only");
            }

            // Determine best MIME type
            const mimeType = this.getBestMimeType();

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000 // 5 Mbps for quality
            });

            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.saveVideo();
            };

            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;

            return { success: true, mimeType };
        } catch (err) {
            console.error("Recording failed:", err);
            return { success: false, error: err.message };
        }
    },

    // Stop recording and save
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            return true;
        }
        return false;
    },

    // Save the recorded video as downloadable file
    saveVideo() {
        const blob = new Blob(this.chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement("a");
        a.href = url;
        a.download = `medical-animation-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        return {
            size: blob.size,
            duration: this.chunks.length * 0.1,
            filename: a.download
        };
    },

    // Get best supported MIME type
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
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return "video/webm"; // Fallback
    },

    // Get recording state
    getState() {
        return {
            isRecording: this.isRecording,
            chunksCount: this.chunks.length,
            estimatedSize: this.chunks.reduce((acc, c) => acc + c.size, 0)
        };
    }
};
