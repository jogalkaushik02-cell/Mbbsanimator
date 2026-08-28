// ============================================
// Main App Controller - With Video Export + AI Research
// ============================================

const App = {
    engine: null,
    history: [],
    currentRecipe: null,
    currentQuiz: [],
    currentQuizIndex: 0,
    researchData: null,
    isRecording: false,
    progressInterval: null,

    async init() {
        setTimeout(() => {
            document.getElementById("splash").classList.add("hidden");
            document.getElementById("app").classList.remove("hidden");
        }, 1500);

        VoiceManager.init();
        const viewport = document.getElementById("viewport3d");
        this.engine = new AnimationEngine(viewport);
        this.engine.onStepChange = (step, i) => this.onStepChange(step, i);
        this.engine.onNarration = (text) => this.onNarration(text);
        this.engine.onFinish = () => this.onFinish();
        this.engine.onTimeUpdate = (e, t) => this.onTimeUpdate(e, t);
        this.engine.onEntityClick = (entity, p) => this.onEntityClick(entity, p);

        this.connectUI();
        this.updateOnlineStatus();
        window.addEventListener("online", () => this.updateOnlineStatus());
        window.addEventListener("offline", () => this.updateOnlineStatus());
    },

    connectUI() {
        document.getElementById("searchBtn").addEventListener("click", () => this.startResearch());
        document.getElementById("topicInput").addEventListener("keydown", (e) => { if (e.key === "Enter") this.startResearch(); });

        document.getElementById("playBtn").addEventListener("click", () => {
            this.engine.play();
            document.getElementById("playBtn").disabled = true;
            document.getElementById("pauseBtn").disabled = false;
        });
        document.getElementById("pauseBtn").addEventListener("click", () => {
            this.engine.pause();
            document.getElementById("playBtn").disabled = false;
            document.getElementById("pauseBtn").disabled = true;
        });
        document.getElementById("replayBtn").addEventListener("click", () => {
            this.engine.replay();
            document.getElementById("playBtn").disabled = true;
            document.getElementById("pauseBtn").disabled = false;
            if (this.currentQuiz.length > 0) this.showQuiz();
        });

        document.getElementById("recordBtn").addEventListener("click", () => this.toggleRecording());
        document.getElementById("screenshotBtn").addEventListener("click", () => this.takeScreenshot());

        document.getElementById("speedSlider").addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            this.engine.setSpeed(val);
            document.getElementById("speedVal").textContent = val + "x";
        });
        document.getElementById("zoomSlider").addEventListener("input", (e) => {
            this.engine.cameraDistance = parseFloat(e.target.value);
        });

        document.getElementById("voiceToggle").addEventListener("click", () => {
            const enabled = VoiceManager.toggle();
            document.getElementById("voiceToggle").textContent = enabled ? "🔊 Voice: ON" : "🔇 Voice: OFF";
        });

        // Touch zoom
        let lastTouchDist = 0;
        document.getElementById("viewport3d").addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            }
        });
        document.getElementById("viewport3d").addEventListener("touchmove", (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.engine.zoom((lastTouchDist - dist) * 0.05);
                lastTouchDist = dist;
                document.getElementById("zoomSlider").value = this.engine.cameraDistance;
            }
        });

        // Mobile bottom nav
        this.setupMobileNav();
    },

    setupMobileNav() {
        const navBtns = document.querySelectorAll(".mobile-nav-btn");
        navBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                navBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const panel = btn.dataset.panel;
                this.switchMobilePanel(panel);
            });
        });
    },

    switchMobilePanel(panel) {
        const leftSidebar = document.querySelector(".sidebar.left-sidebar");
        const rightSidebar = document.querySelector(".sidebar.right-sidebar");
        const viewport = document.querySelector(".viewport-section");

        leftSidebar.classList.remove("mobile-active");
        rightSidebar.classList.remove("mobile-active");
        viewport.classList.remove("mobile-hidden");

        switch (panel) {
            case "topic":
                leftSidebar.classList.add("mobile-active");
                viewport.classList.add("mobile-hidden");
                break;
            case "viewport":
                break;
            case "info":
                rightSidebar.classList.add("mobile-active");
                viewport.classList.add("mobile-hidden");
                break;
            case "quiz":
                rightSidebar.classList.add("mobile-active");
                viewport.classList.add("mobile-hidden");
                break;
        }
    },

    // ---- VIDEO RECORDING ----

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    },

    async startRecording() {
        const canvas = this.engine.renderer.domElement;
        const result = await VideoRecorder.startRecording(canvas);
        if (result.success) {
            this.isRecording = true;
            document.getElementById("recordBtn").textContent = "⏹ Stop Recording";
            document.getElementById("recordBtn").classList.add("recording");
            const statusEl = document.getElementById("recordStatus");
            statusEl.classList.remove("hidden");
            statusEl.textContent = "Recording... 0:00 | ~0 MB";
            this.recordTimer = setInterval(() => {
                if (statusEl) {
                    statusEl.textContent = `Recording... ${VideoRecorder.getRecordingDuration()} | ${VideoRecorder.getEstimatedSize()}`;
                }
            }, 1000);
        } else {
            document.getElementById("statusText").textContent = "Recording failed: " + result.error;
        }
    },

    stopRecording() {
        if (this.recordTimer) clearInterval(this.recordTimer);
        if (VideoRecorder.stopRecording()) {
            this.isRecording = false;
            document.getElementById("recordBtn").textContent = "⏺ Record Video";
            document.getElementById("recordBtn").classList.remove("recording");
            const statusEl = document.getElementById("recordStatus");
            statusEl.textContent = "Video saved! Check downloads.";
            setTimeout(() => statusEl.classList.add("hidden"), 3000);
        }
    },

    takeScreenshot() {
        const canvas = this.engine.renderer.domElement;
        VideoRecorder.takeScreenshot(canvas);
        document.getElementById("statusText").textContent = "Screenshot saved!";
    },

    // ---- PROGRESS BAR ----

    startProgressBar(totalSteps) {
        this.progressTotal = totalSteps;
        this.progressDone = 0;
        this.updateProgressBar();
    },

    updateProgressBar() {
        if (this.progressTotal === 0) return;
        const pct = Math.min(100, Math.round((this.progressDone / this.progressTotal) * 100));
        const bar = document.getElementById("progressBar");
        const text = document.getElementById("progressText");
        if (bar) bar.style.width = pct + "%";
        if (text) text.textContent = pct + "%";
    },

    finishProgressBar() {
        const bar = document.getElementById("progressBar");
        const text = document.getElementById("progressText");
        if (bar) bar.style.width = "100%";
        if (text) text.textContent = "100%";
        setTimeout(() => {
            if (bar) bar.style.width = "0%";
            if (text) text.textContent = "0%";
        }, 1500);
    },

    // ---- RESEARCH ----

    async startResearch() {
        const topic = document.getElementById("topicInput").value.trim();
        if (!topic) return;

        const panel = document.getElementById("researchPanel");
        panel.classList.remove("hidden");
        document.getElementById("researchTopic").textContent = topic;
        document.getElementById("statusText").textContent = "Researching: " + topic + "...";

        ["pubmed", "openalex", "crossref", "semantic", "wikipedia", "scholar", "duckduckgo"].forEach(src => {
            const el = document.getElementById("src-" + src);
            if (el) { el.className = "source-item"; }
        });

        document.getElementById("searchBtn").disabled = true;
        document.getElementById("researchStatus").textContent = "Searching all databases in parallel...";

        // Start progress bar: 7 databases + 1 synthesis = 8 steps
        this.startProgressBar(8);

        // Simulate incremental progress while waiting
        const progressSteps = ["PubMed", "OpenAlex", "CrossRef", "SemanticScholar", "Wikipedia", "GoogleScholar", "DuckDuckGo", "Synthesizing"];
        let currentStep = 0;
        this.progressInterval = setInterval(() => {
            if (currentStep < progressSteps.length) {
                document.getElementById("researchStatus").textContent = "Searching " + progressSteps[currentStep] + "...";
                currentStep++;
                this.progressDone = currentStep;
                this.updateProgressBar();
                // Update source indicators as we go
                if (currentStep <= 7) {
                    const srcIds = ["pubmed", "openalex", "crossref", "semantic", "wikipedia", "scholar", "duckduckgo"];
                    const el = document.getElementById("src-" + srcIds[currentStep - 1]);
                    if (el) el.className = "source-item loading";
                }
            }
        }, 2000);

        try {
            const res = await fetch("/api/full-research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic })
            });

            if (this.progressInterval) clearInterval(this.progressInterval);

            if (res.ok) {
                const data = await res.json();
                this.researchData = data;
                this.finishProgressBar();
                this.updateSourceIndicators(data.research);
                this.displayResearchResults(data.research);
                document.getElementById("researchStatus").textContent = `Found ${data.research.sourcesFound || 0} sources`;

                if (data.synthesized) {
                    this.loadSynthesizedAnimation(data.synthesized, topic);
                } else {
                    this.createGenericAnimation(topic);
                }
            } else {
                this.finishProgressBar();
                const errText = await res.text().catch(() => "Unknown error");
                document.getElementById("researchStatus").textContent = "Research failed (" + res.status + ")";
                document.getElementById("statusText").textContent = "Server error: " + errText;
            }
        } catch (err) {
            if (this.progressInterval) clearInterval(this.progressInterval);
            this.finishProgressBar();
            console.error("Research error:", err);
            document.getElementById("researchStatus").textContent = "Error: " + (err.message || "Connection failed");
            document.getElementById("statusText").textContent = "Failed to reach server. Check internet and try again.";
        }

        document.getElementById("searchBtn").disabled = false;
        setTimeout(() => panel.classList.add("hidden"), 3000);
        this.addToHistory(topic);
    },

    updateSourceIndicators(research) {
        const update = (src, count) => {
            const el = document.getElementById("src-" + src);
            if (!el) return;
            if (count > 0) { el.className = "source-item done"; } else { el.className = "source-item error"; }
        };
        update("pubmed", research.pubmed?.count || 0);
        update("openalex", research.openalex?.count || 0);
        update("crossref", research.crossref?.count || 0);
        update("semantic", research.semanticScholar?.count || 0);
        update("wikipedia", research.wikipedia ? 1 : 0);
        update("scholar", research.googleScholar?.count || 0);
        update("duckduckgo", research.duckduckgo?.abstract ? 1 : 0);
    },

    displayResearchResults(research) {
        const container = document.getElementById("researchResults");
        let html = "";

        if (research.pubmed?.articles?.length > 0) {
            html += `<div class="research-source"><h4>PubMed (${research.pubmed.count})</h4>`;
            research.pubmed.articles.forEach(a => {
                html += `<div class="research-article"><div class="article-title"><a href="${a.url}" target="_blank">${a.title}</a></div><div class="article-meta">${a.journal || ""} | ${a.year || ""}</div></div>`;
            });
            html += "</div>";
        }
        if (research.wikipedia) {
            html += `<div class="research-source"><h4>Wikipedia</h4><div class="research-article"><div class="article-title"><a href="${research.wikipedia.url}" target="_blank">${research.wikipedia.title}</a></div></div></div>`;
        }
        if (research.openalex?.articles?.length > 0) {
            html += `<div class="research-source"><h4>OpenAlex (${research.openalex.count})</h4>`;
            research.openalex.articles.slice(0, 3).forEach(a => {
                html += `<div class="research-article"><div class="article-title"><a href="${a.url}" target="_blank">${a.title}</a></div><div class="article-meta">${a.journal || ""} | Cited: ${a.citedBy || 0}</div></div>`;
            });
            html += "</div>";
        }
        if (research.semanticScholar?.articles?.length > 0) {
            html += `<div class="research-source"><h4>SemanticScholar (${research.semanticScholar.count})</h4>`;
            research.semanticScholar.articles.slice(0, 3).forEach(a => {
                html += `<div class="research-article"><div class="article-title"><a href="${a.url}" target="_blank">${a.title}</a></div></div>`;
            });
            html += "</div>";
        }
        container.innerHTML = html || '<p class="muted">No results</p>';
    },

    loadSynthesizedAnimation(synthesized, topic) {
        const steps = synthesized.animationSteps.map((s, i) => ({
            ...s,
            narration: synthesized.narration[i]?.text || s.description,
            effect: ["doctor_explain", "doctor_point_bacterium", "doctor_point_macrophage", "doctor_write", "glow_macrophage"][i % 5],
            camera: { distance: 18 - (i * 1.5), angle: i * 0.4 }
        }));

        const recipe = {
            id: "synthesized",
            name: topic,
            description: synthesized.facts.slice(0, 3).map(f => f.text).join(" "),
            duration: steps.length * 2.5 + 4,
            entities: ["macrophage", "bacterium"],
            steps: [
                { name: "Introduction", duration: 3, narration: synthesized.narration[0]?.text || `Let us learn about ${topic}.`, effect: "doctor_explain", camera: { distance: 20, angle: 0 } },
                ...steps,
                { name: "Summary", duration: 2, narration: `This concludes our lesson on ${topic}.`, effect: "doctor_explain", camera: { distance: 18, angle: 3.0 } }
            ],
            quiz: synthesized.quiz || []
        };

        this.currentRecipe = recipe;
        this.currentQuiz = recipe.quiz;
        this.engine.loadRecipe(recipe);

        document.getElementById("stepLabel").textContent = topic;
        document.getElementById("statusText").textContent = "Loaded: " + topic + " (from " + synthesized.factsFound + " research facts)";
        this.showQuiz();
    },

    createGenericAnimation(topic) {
        const recipe = {
            id: "generic", name: topic, description: topic, duration: 12,
            entities: ["macrophage", "bacterium"],
            steps: [
                { name: "Introduction", duration: 3, narration: `Welcome students. Today we will learn about ${topic}.`, effect: "doctor_explain", camera: { distance: 20, angle: 0 } },
                { name: "Research", duration: 3, narration: `Researching ${topic} from medical databases. This topic will be covered based on available data.`, effect: "doctor_point_bacterium", camera: { distance: 16, angle: 0.5 } },
                { name: "Key Concepts", duration: 3, narration: `The key concepts involve multiple mechanisms and pathways.`, effect: "doctor_write", camera: { distance: 12, angle: 1.0 } },
                { name: "Summary", duration: 3, narration: `Understanding ${topic} is essential for medical practice.`, effect: "doctor_explain", camera: { distance: 18, angle: 1.5 } }
            ],
            quiz: [{ question: `What is ${topic}?`, options: ["A medical concept", "A structure", "A disease", "A drug"], correct: 0, explanation: `${topic} is an important medical concept.` }]
        };
        this.currentRecipe = recipe;
        this.currentQuiz = recipe.quiz;
        this.engine.loadRecipe(recipe);
        document.getElementById("stepLabel").textContent = topic;
        document.getElementById("statusText").textContent = "Generic animation: " + topic;
    },

    // ---- CALLBACKS ----

    onStepChange(step, index) {
        document.getElementById("stepLabel").textContent = `${index + 1}. ${step.name}`;
        VoiceManager.playStepSound();
    },

    onNarration(text) {
        document.getElementById("narrationText").textContent = text;
        VoiceManager.speak(text);
    },

    onFinish() {
        document.getElementById("playBtn").disabled = false;
        document.getElementById("pauseBtn").disabled = true;
        document.getElementById("statusText").textContent = "Animation complete";
        if (this.currentQuiz.length > 0) this.showQuiz();
        if (this.isRecording) this.stopRecording();
    },

    onTimeUpdate(elapsed, total) {
        const pct = (elapsed / total) * 100;
        const eMin = Math.floor(elapsed / 60), eSec = Math.floor(elapsed % 60);
        const tMin = Math.floor(total / 60), tSec = Math.floor(total % 60);
        document.getElementById("timeDisplay").textContent = `${eMin}:${String(eSec).padStart(2, "0")} / ${tMin}:${String(tSec).padStart(2, "0")}`;
    },

    onEntityClick(entity, point) {
        const info = document.getElementById("entityInfo");
        let html = `<h4>${entity.commonName}</h4><div class="scientific">${entity.scientificName}</div><p style="margin-top:8px">${entity.description}</p>`;
        if (entity.functions) {
            html += `<div style="margin-top:8px">`;
            entity.functions.forEach(f => { html += `<span class="func-tag">${f}</span>`; });
            html += "</div>";
        }
        if (entity.tags) html += `<div style="margin-top:6px;font-size:11px;color:var(--text-muted)">Tags: ${entity.tags.join(", ")}</div>`;
        info.innerHTML = html;
    },

    // ---- QUIZ ----

    showQuiz() {
        if (this.currentQuiz.length === 0) return;
        this.currentQuizIndex = 0;
        this.renderQuiz();
        document.getElementById("quizCard").classList.remove("hidden");
    },

    renderQuiz() {
        if (this.currentQuizIndex >= this.currentQuiz.length) {
            document.getElementById("quizQuestion").textContent = "Quiz Complete! 🎉";
            document.getElementById("quizOptions").innerHTML = "";
            return;
        }
        const q = this.currentQuiz[this.currentQuizIndex];
        document.getElementById("quizQuestion").textContent = `Q${this.currentQuizIndex + 1}: ${q.question}`;
        document.getElementById("quizResult").classList.add("hidden");
        const optionsDiv = document.getElementById("quizOptions");
        optionsDiv.innerHTML = "";
        q.options.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "quiz-option";
            btn.textContent = opt;
            btn.addEventListener("click", () => this.answerQuiz(i, q.correct, q.explanation));
            optionsDiv.appendChild(btn);
        });
    },

    answerQuiz(selected, correct, explanation) {
        const options = document.querySelectorAll(".quiz-option");
        options.forEach((opt, i) => {
            opt.disabled = true;
            if (i === correct) opt.classList.add("correct");
            if (i === selected && selected !== correct) opt.classList.add("wrong");
        });
        const result = document.getElementById("quizResult");
        result.classList.remove("hidden");
        if (selected === correct) {
            result.className = "quiz-result correct";
            result.textContent = "✅ Correct! " + explanation;
            VoiceManager.playCorrectSound();
        } else {
            result.className = "quiz-result wrong";
            result.textContent = "❌ Incorrect. " + explanation;
            VoiceManager.playWrongSound();
        }
        setTimeout(() => { this.currentQuizIndex++; this.renderQuiz(); }, 3000);
    },

    // ---- HISTORY ----

    addToHistory(topic) {
        if (!this.history.includes(topic)) {
            this.history.unshift(topic);
            if (this.history.length > 10) this.history.pop();
            this.renderHistory();
        }
    },

    renderHistory() {
        const list = document.getElementById("historyList");
        list.innerHTML = "";
        this.history.forEach(topic => {
            const item = document.createElement("div");
            item.className = "history-item";
            item.textContent = topic;
            item.addEventListener("click", () => {
                document.getElementById("topicInput").value = topic;
                this.startResearch();
            });
            list.appendChild(item);
        });
    },

    updateOnlineStatus() {
        const badge = document.getElementById("onlineBadge");
        if (navigator.onLine) {
            badge.textContent = "🟢 Online";
            badge.style.borderColor = "var(--success)";
            badge.style.color = "var(--success)";
        } else {
            badge.textContent = "🔴 Offline";
            badge.style.borderColor = "var(--error)";
            badge.style.color = "var(--error)";
        }
    }
};

document.addEventListener("DOMContentLoaded", () => App.init());
