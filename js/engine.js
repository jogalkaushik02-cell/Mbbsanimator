// ============================================
// Animation Engine - Storyboard-driven 3D
// Labels, camera transitions, biological animations
// ============================================

class AnimationEngine {
    constructor(viewportElement) {
        this.viewport = viewportElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.entities = {};
        this.currentRecipe = null;
        this.currentStoryboard = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.elapsedTime = 0;
        this.playbackSpeed = 1.0;
        this.currentStepIndex = -1;
        this.cameraDistance = 15;
        this.cameraAngle = 0;
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onStepChange = null;
        this.onNarration = null;
        this.onFinish = null;
        this.onTimeUpdate = null;
        this.onEntityClick = null;
        this.stepEffects = {};
        this.animationMixers = [];
        this.clock = new THREE.Clock();
        this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.pixelRatio = this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
        this.starCount = this.isMobile ? 100 : 500;
        this.labelContainer = null;
        this._createLabelOverlay();
        this.init();
    }

    _createLabelOverlay() {
        this.labelContainer = document.createElement("div");
        this.labelContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;font-family:'Segoe UI',system-ui,sans-serif;";
        this.viewport.style.position = "relative";
        this.viewport.appendChild(this.labelContainer);
    }

    _updateLabels(scene) {
        if (!this.labelContainer) return;
        this.labelContainer.innerHTML = "";
        if (!scene || !scene.labels) return;
        const vw = this.viewport.clientWidth, vh = this.viewport.clientHeight;
        for (const label of scene.labels) {
            let screenPos;
            if (label.entity && this.entities[label.entity]) {
                const worldPos = new THREE.Vector3();
                this.entities[label.entity].getWorldPosition(worldPos);
                screenPos = worldPos.clone().project(this.camera);
            } else if (label.position) {
                const worldPos = new THREE.Vector3(label.position[0], label.position[1], label.position[2]);
                screenPos = worldPos.clone().project(this.camera);
            } else continue;
            const x = (screenPos.x * 0.5 + 0.5) * vw + (label.offset ? label.offset[0] : 0);
            const y = (-screenPos.y * 0.5 + 0.5) * vh + (label.offset ? label.offset[1] : 0);
            const div = document.createElement("div");
            div.style.cssText = "position:absolute;pointer-events:none;transition:all 0.4s ease;";
            const isTitle = label.text && label.text.length < 30 && !label.entity;
            if (isTitle) {
                div.style.cssText += "top:12px;left:50%;transform:translateX(-50%);background:rgba(10,22,40,0.85);border:1px solid rgba(79,195,247,0.5);border-radius:8px;padding:6px 14px;color:#4fc3f7;font-size:13px;font-weight:600;letter-spacing:0.5px;white-space:nowrap;text-shadow:0 0 8px rgba(79,195,247,0.4);";
            } else {
                div.style.cssText += `left:${Math.max(10, Math.min(vw - 120, x))}px;top:${Math.max(10, Math.min(vh - 30, y - 15))}px;background:rgba(10,22,40,0.8);border:1px solid rgba(100,180,255,0.3);border-radius:4px;padding:3px 8px;color:#8ec8f0;font-size:11px;white-space:nowrap;`;
                div.style.cssText += "font-weight:400;";
            }
            div.textContent = label.text;
            this.labelContainer.appendChild(div);
        }
    }

    init() {
        this.scene = new THREE.Scene();
        const aspect = this.viewport.clientWidth / this.viewport.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.viewport.clientWidth, this.viewport.clientHeight);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setClearColor(0x0a1628, 1);
        this.renderer.shadowMap.enabled = true;
        this.viewport.appendChild(this.renderer.domElement);
        const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        const fillLight = new THREE.DirectionalLight(0x4488aa, 0.4);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
        this._createBackground();
        window.addEventListener("resize", () => this.onResize());
        this.viewport.addEventListener("click", (e) => this.onClick(e));
        this.viewport.addEventListener("touchend", (e) => this.onTouch(e));
        this._setupDragControls();
        this.animate();
    }

    _createBackground() {
        const starsGeo = new THREE.BufferGeometry();
        const positions = [];
        for (let i = 0; i < this.starCount; i++) {
            positions.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
        }
        starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        this.scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0x334466, size: 0.2 })));
    }

    _setupDragControls() {
        let isDragging = false, prevX = 0;
        this.viewport.addEventListener("mousedown", (e) => { isDragging = true; prevX = e.clientX; });
        window.addEventListener("mousemove", (e) => { if (isDragging) { this.cameraAngle += (e.clientX - prevX) * 0.005; prevX = e.clientX; } });
        window.addEventListener("mouseup", () => isDragging = false);
        this.viewport.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { isDragging = true; prevX = e.touches[0].clientX; }});
        window.addEventListener("touchmove", (e) => { if (isDragging && e.touches.length === 1) { this.cameraAngle += (e.touches[0].clientX - prevX) * 0.005; prevX = e.touches[0].clientX; }});
        window.addEventListener("touchend", () => isDragging = false);
    }

    // ============ SMOOTH KEYFRAME INTERPOLATION ENGINE ============
    // This is the CORE - makes animations smooth, not slideshows

    _lerp(a, b, t) { return a + (b - a) * t; }
    _lerpVec3(a, b, t) { return new THREE.Vector3(this._lerp(a.x, b.x, t), this._lerp(a.y, b.y, t), this._lerp(a.z, b.z, t)); }
    _lerpColor(a, b, t) { return new THREE.Color(this._lerp(a.r, b.r, t), this._lerp(a.g, b.g, t), this._lerp(a.b, b.b, t)); }
    _smoothstep(t) { return t * t * (3 - 2 * t); }
    _easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    // Spline interpolation for camera paths
    _spline(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }

    // ============ LOAD RECIPE / STORYBOARD ============

    loadRecipe(recipe, storyboard) {
        this.clearScene();
        this.currentRecipe = recipe;
        this.currentStoryboard = storyboard || null;
        this.elapsedTime = 0;
        this.currentStepIndex = -1;
        this.isPlaying = false;
        this.isPaused = false;
        this.stepEffects = {};

        // Always add Dr. Doom
        const drDoom = AssetLibrary.createAsset("dr_doom");
        drDoom.position.set(-3, 0, 2);
        drDoom.scale.setScalar(1.2);
        this.scene.add(drDoom);
        this.entities["dr_doom"] = drDoom;

        // Spawn recipe entities
        for (const entityId of recipe.entities) {
            const asset = AssetLibrary.createAsset(entityId);
            if (asset) {
                if (entityId === "macrophage" || entityId === "human_cell") asset.position.set(0, 0, 0);
                else if (entityId === "bacterium") asset.position.set(8, 0, 0);
                this.scene.add(asset);
                this.entities[entityId] = asset;
            }
        }

        const firstScene = this.currentStoryboard?.scenes?.[0];
        this.cameraDistance = firstScene?.camera?.distance || recipe.steps[0]?.camera?.distance || 15;
        this.cameraAngle = firstScene?.camera?.angle || recipe.steps[0]?.camera?.angle || 0;
    }

    clearScene() {
        for (const key in this.entities) {
            this.scene.remove(this.entities[key]);
            delete this.entities[key];
        }
        this.currentRecipe = null;
        this.currentStoryboard = null;
        this.currentStepIndex = -1;
        if (this.labelContainer) this.labelContainer.innerHTML = "";
    }

    // ============ PLAYBACK ============

    play() { if (!this.currentRecipe) return; this.isPlaying = true; this.isPaused = false; VoiceManager.playClickSound(); }
    pause() { this.isPaused = true; VoiceManager.playClickSound(); }
    resume() { this.isPaused = false; }
    replay() { this.elapsedTime = 0; this.currentStepIndex = -1; this.isPlaying = true; this.isPaused = false; this._resetEntities(); if (this.labelContainer) this.labelContainer.innerHTML = ""; VoiceManager.playClickSound(); }
    togglePlayPause() { if (this.isPaused) this.resume(); else if (!this.isPlaying) this.play(); else this.pause(); }
    setSpeed(s) { this.playbackSpeed = Math.max(0.25, Math.min(3, s)); }
    zoom(d) { this.cameraDistance = Math.max(5, Math.min(30, this.cameraDistance + d)); }

    // ============ MAIN ANIMATION LOOP ============

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        if (this.isPlaying && !this.isPaused && this.currentRecipe) {
            this._update(delta);
        }
        this._animateDrDoom(delta);
        this._updateCamera(delta);
        this.renderer.render(this.scene, this.camera);
    }

    _update(delta) {
        if (!this.currentRecipe) return;
        const dt = delta * this.playbackSpeed;
        this.elapsedTime += dt;
        const totalDuration = this.currentRecipe.duration;
        if (this.elapsedTime >= totalDuration) {
            this.elapsedTime = totalDuration;
            this.isPlaying = false;
            if (this.onFinish) this.onFinish();
            return;
        }

        // Find current step
        let accumulated = 0;
        for (let i = 0; i < this.currentRecipe.steps.length; i++) {
            const step = this.currentRecipe.steps[i];
            if (this.elapsedTime < accumulated + step.duration) {
                if (this.currentStepIndex !== i) {
                    this.currentStepIndex = i;
                    if (this.onStepChange) this.onStepChange(step, i);
                    if (step.narration && this.onNarration) this.onNarration(step.narration);
                    // Update storyboard labels for this scene
                    if (this.currentStoryboard && this.currentStoryboard.scenes[i]) {
                        this._updateLabels(this.currentStoryboard.scenes[i]);
                    }
                }
                const localTime = this.elapsedTime - accumulated;
                const t = localTime / step.duration;
                this._processStepSmooth(step, t, localTime);
                break;
            }
            accumulated += step.duration;
        }
        if (this.onTimeUpdate) this.onTimeUpdate(this.elapsedTime, totalDuration);
    }

    // ============ SMOOTH STEP PROCESSING ============
    // Every effect is interpolated smoothly over time

    _processStepSmooth(step, t, localTime) {
        const et = this._easeInOut(t);

        // Camera movement from storyboard or step
        const sceneData = this.currentStoryboard?.scenes?.[this.currentStepIndex];
        const camData = sceneData?.camera || step.camera;
        if (camData) {
            const targetDist = camData.distance;
            const targetAngle = camData.angle;
            this.cameraDistance = this._lerp(this.cameraDistance, targetDist, 0.02);
            this.cameraAngle = this._lerp(this.cameraAngle, targetAngle, 0.02);
            if (camData.target) {
                const tx = camData.target[0] || 0, ty = camData.target[1] || 0, tz = camData.target[2] || 0;
                this.cameraTarget.x = this._lerp(this.cameraTarget.x, tx, 0.02);
                this.cameraTarget.y = this._lerp(this.cameraTarget.y, ty, 0.02);
                this.cameraTarget.z = this._lerp(this.cameraTarget.z, tz, 0.02);
            }
        }

        if (!step.effect) return;

        switch (step.effect) {

            // ---- DR. DOOM TEACHING GESTURES ----
            case "doctor_explain":
                this._animateDrDoomExplain(t);
                break;
            case "doctor_point_bacterium":
                this._animateDrDoomPoint(t, this.entities["bacterium"]);
                break;
            case "doctor_point_macrophage":
                this._animateDrDoomPoint(t, this.entities["macrophage"]);
                break;
            case "doctor_write":
                this._animateDrDoomWrite(t);
                break;
            case "doctor_angry":
                this._animateDrDoomAngry(t);
                break;

            // ---- BIOLOGICAL EFFECTS ----
            case "glow_macrophage":
                this._effectGlow("macrophage", et);
                break;
            case "extend_pseudopods":
                this._effectExtendPseudopods(et);
                break;
            case "engulf":
                this._effectEngulf(et);
                break;
            case "form_phagosome":
                this._effectFormPhagosome(et);
                break;
            case "fuse_lysosomes":
                this._effectFuseLysosomes(et);
                break;
            case "destroy":
                this._effectDestroy(et);
                break;
            case "bacterium_swim":
                this._effectBacteriumSwim(t, localTime);
                break;
            case "macrophage_patrol":
                this._effectMacrophagePatrol(t, localTime);
                break;
            case "highlight_nucleus":
                this._effectHighlight("Nucleus", et);
                break;
            case "highlight_mitochondria":
                this._effectHighlight("Mitochondria", et);
                break;
            case "highlight_lysosomes":
                this._effectHighlight("Lysosome", et);
                break;
        }
    }

    // ============ DR. DOOM ANIMATIONS ============
    // Teaching character with smooth gestures

    _animateDrDoomExplain(t) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;

        // Gentle body sway
        doc.rotation.y = Math.sin(t * Math.PI * 2) * 0.15;
        doc.position.y = Math.sin(t * Math.PI * 3) * 0.05;

        // Right arm gesturing
        const rightArm = doc.getObjectByName("RightArm");
        if (rightArm) {
            rightArm.rotation.z = -0.5 + Math.sin(t * Math.PI * 4) * 0.4;
            rightArm.rotation.x = Math.sin(t * Math.PI * 3) * 0.2;
        }

        // Right hand following arm
        const rightHand = doc.getObjectByName("RightHand");
        if (rightHand) {
            rightHand.position.y = 0.45 + Math.sin(t * Math.PI * 4) * 0.15;
            rightHand.position.x = 0.48 + Math.sin(t * Math.PI * 4) * 0.1;
        }

        // Pen bobbing
        const pen = doc.getObjectByName("Pen");
        if (pen) {
            pen.rotation.x = Math.sin(t * Math.PI * 5) * 0.1;
        }

        // Head slight nod
        const head = doc.getObjectByName("Head");
        if (head) {
            head.rotation.x = Math.sin(t * Math.PI * 2) * 0.05;
        }
    }

    _animateDrDoomPoint(t, target) {
        const doc = this.entities["dr_doom"];
        if (!doc || !target) return;

        // Face the target
        const dir = new THREE.Vector3().subVectors(target.position, doc.position).normalize();
        const targetAngle = Math.atan2(dir.x, dir.z);
        doc.rotation.y = this._lerp(doc.rotation.y, targetAngle, 0.05);

        // Point with right arm
        const rightArm = doc.getObjectByName("RightArm");
        if (rightArm) {
            const armAngle = -1.2 + Math.sin(t * Math.PI * 2) * 0.15;
            rightArm.rotation.z = this._lerp(rightArm.rotation.z, armAngle, 0.08);
            rightArm.rotation.x = this._lerp(rightArm.rotation.x, -0.3, 0.08);
        }

        // Hand extended
        const rightHand = doc.getObjectByName("RightHand");
        if (rightHand) {
            rightHand.position.x = this._lerp(rightHand.position.x, 0.7, 0.06);
            rightHand.position.y = this._lerp(rightHand.position.y, 0.8, 0.06);
            rightHand.position.z = this._lerp(rightHand.position.z, 0.3, 0.06);
        }

        // Pen follows hand
        const pen = doc.getObjectByName("Pen");
        if (pen) {
            pen.position.x = this._lerp(pen.position.x, 0.72, 0.06);
            pen.position.y = this._lerp(pen.position.y, 0.9, 0.06);
        }

        // Slight body lean toward target
        doc.position.x = this._lerp(doc.position.x, target.position.x - 3, 0.03);
        doc.position.z = this._lerp(doc.position.z, target.position.z + 2, 0.03);
    }

    _animateDrDoomWrite(t) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;

        // Writing motion with pen
        const pen = doc.getObjectByName("Pen");
        if (pen) {
            pen.position.x = -0.5 + Math.sin(t * Math.PI * 8) * 0.08;
            pen.position.y = 0.55 + Math.cos(t * Math.PI * 6) * 0.04;
            pen.rotation.z = 0.3 + Math.sin(t * Math.PI * 8) * 0.15;
        }

        // Left arm moves for writing
        const leftArm = doc.getObjectByName("LeftArm");
        if (leftArm) {
            leftArm.rotation.z = 0.5 + Math.sin(t * Math.PI * 8) * 0.1;
        }

        // Head follows pen
        const head = doc.getObjectByName("Head");
        if (head) {
            head.rotation.z = Math.sin(t * Math.PI * 4) * 0.08;
            head.rotation.x = -0.1;
        }
    }

    _animateDrDoomAngry(t) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;

        // Angry shake
        doc.rotation.z = Math.sin(t * Math.PI * 12) * 0.05;
        doc.position.y = Math.abs(Math.sin(t * Math.PI * 6)) * 0.1;

        // Arms up
        const rightArm = doc.getObjectByName("RightArm");
        if (rightArm) rightArm.rotation.z = this._lerp(rightArm.rotation.z, -1.5, 0.1);

        const leftArm = doc.getObjectByName("LeftArm");
        if (leftArm) leftArm.rotation.z = this._lerp(leftArm.rotation.z, 1.5, 0.1);
    }

    _animateDrDoom(delta) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;
        const time = this.clock.elapsedTime;
        doc.position.y = Math.sin(time * 1.5) * 0.03;
        if (!this.isPlaying) {
            const rightArm = doc.getObjectByName("RightArm");
            if (rightArm) rightArm.rotation.z = -0.5 + Math.sin(time * 2) * 0.1;
        }

        // Idle animations for ALL entities
        for (const [id, entity] of Object.entries(this.entities)) {
            if (id === "dr_doom") continue;
            // Gentle float
            entity.position.y += Math.sin(time * 1.2 + entity.id) * 0.001;
            // Gentle rotation for some models
            if (id === "virus" || id === "dna" || id === "antibody") {
                entity.rotation.y += 0.005;
            }
            if (id === "heart") {
                const beat = 1 + Math.sin(time * 4) * 0.03;
                entity.scale.setScalar(beat);
            }
            if (id === "red_blood_cell") {
                entity.rotation.x += 0.003;
                entity.position.y += Math.sin(time * 2) * 0.002;
            }
            if (id === "neuron") {
                entity.children.forEach(child => {
                    if (child.name === "Nucleus") {
                        child.material.emissive = new THREE.Color(0xffd700);
                        child.material.emissiveIntensity = 0.2 + Math.sin(time * 3) * 0.15;
                    }
                });
            }
            if (id === "cancer_cell") {
                entity.rotation.y += 0.008;
                entity.rotation.x += 0.004;
            }
            if (id === "brain") {
                entity.rotation.y = Math.sin(time * 0.3) * 0.05;
            }
            if (id === "stem_cell") {
                const glow = entity.getObjectByName("Glow");
                if (glow && glow.material) {
                    glow.material.opacity = 0.08 + Math.sin(time * 2) * 0.05;
                }
            }
        }
    }

    // ============ BIOLOGICAL EFFECTS ============
    // Each effect represents a real biological event

    _effectGlow(entityId, t) {
        const entity = this.entities[entityId];
        if (!entity) return;
        const body = entity.getObjectByName("CellBody");
        if (body && body.material) {
            body.material.emissive = new THREE.Color(0x4fc3f7);
            body.material.emissiveIntensity = Math.sin(t * Math.PI) * 0.4;
        }
    }

    _effectExtendPseudopods(t) {
        const macrophage = this.entities["macrophage"];
        const bacterium = this.entities["bacterium"];
        if (!macrophage || !bacterium) return;

        // Calculate direction toward bacterium
        const dir = new THREE.Vector3().subVectors(bacterium.position, macrophage.position).normalize();

        macrophage.children.forEach((child, i) => {
            if (child.userData.isPseudopod) {
                // Each pseudopod extends differently - the one facing bacterium extends most
                const podDir = new THREE.Vector3(Math.cos((i / 4) * Math.PI * 2 + Math.PI / 4), 0, Math.sin((i / 4) * Math.PI * 2 + Math.PI / 4));
                const alignment = podDir.dot(dir);

                // Pseudopods facing bacterium extend more
                const extensionFactor = Math.max(0, alignment) * t * 2.5;
                const baseExtension = t * 0.8;

                // Elongate along its axis
                child.scale.y = 1 + baseExtension + extensionFactor;

                // Move outward from cell body
                const outward = podDir.multiplyScalar(0.3 + extensionFactor * 0.4);
                child.position.x = Math.cos((i / 4) * Math.PI * 2 + Math.PI / 4) * (0.9 + extensionFactor * 0.3);
                child.position.z = Math.sin((i / 4) * Math.PI * 2 + Math.PI / 4) * (0.9 + extensionFactor * 0.3);

                // Orient toward bacterium
                if (extensionFactor > 0.5) {
                    child.rotation.z = this._lerp(child.rotation.z, -dir.x * 0.8, 0.05);
                    child.rotation.x = this._lerp(child.rotation.x, dir.z * 0.8, 0.05);
                }
            }
        });

        // Membrane undulation during extension
        const body = macrophage.getObjectByName("CellBody");
        if (body) {
            body.material.emissive = new THREE.Color(0x4fc3f7);
            body.material.emissiveIntensity = Math.sin(t * Math.PI * 6) * 0.15;
        }
    }

    _effectEngulf(t) {
        const bacterium = this.entities["bacterium"];
        const macrophage = this.entities["macrophage"];
        if (!bacterium) return;

        // Phase 1 (0-0.3): Bacterium slides toward macrophage surface
        // Phase 2 (0.3-0.7): Bacterium enters pseudopod cup
        // Phase 3 (0.7-1.0): Membrane closes around bacterium

        if (t < 0.3) {
            // Slide toward macrophage
            const slideT = t / 0.3;
            bacterium.position.x = this._lerp(2.5, 1.2, slideT);
            bacterium.position.y = this._lerp(0, 0.2, Math.sin(slideT * Math.PI));
            bacterium.rotation.z += 0.02;
        } else if (t < 0.7) {
            // Enter pseudopod cup - lower into position
            const cupT = (t - 0.3) / 0.4;
            bacterium.position.x = this._lerp(1.2, 0.3, cupT);
            bacterium.position.y = this._lerp(0.2, 0, cupT);
            bacterium.rotation.y += 0.04;
            bacterium.rotation.z += 0.03;
            // Scale down slightly as it enters
            const s = this._lerp(1, 0.6, cupT);
            bacterium.scale.setScalar(Math.max(0.3, s));
        } else {
            // Membrane closes - bacterium moves inside
            const closeT = (t - 0.7) / 0.3;
            bacterium.position.x = this._lerp(0.3, 0, closeT);
            bacterium.position.y = 0;
            bacterium.rotation.y += 0.05;
            const s = this._lerp(0.6, 0.3, closeT);
            bacterium.scale.setScalar(Math.max(0.15, s));
        }

        // Pseudopods close around bacterium
        if (macrophage && t > 0.5) {
            const closeProgress = (t - 0.5) / 0.5;
            macrophage.children.forEach((child, i) => {
                if (child.userData.isPseudopod) {
                    // Pseudopods tilt inward to close the cup
                    const tiltAngle = closeProgress * 0.4;
                    child.rotation.z = this._lerp(child.rotation.z, tiltAngle * Math.cos((i / 4) * Math.PI * 2), 0.08);
                    child.rotation.x = this._lerp(child.rotation.x, tiltAngle * Math.sin((i / 4) * Math.PI * 2), 0.08);
                }
            });
        }
    }

    _effectFormPhagosome(t) {
        if (!this.entities["phagosome"] && t > 0.15) {
            const phagosome = AssetLibrary.createAsset("phagosome");
            phagosome.position.set(0, 0, 0);
            phagosome.scale.setScalar(0.01);
            this.scene.add(phagosome);
            this.entities["phagosome"] = phagosome;

            // Hide bacterium - it's now inside
            if (this.entities["bacterium"]) {
                this.entities["bacterium"].visible = false;
            }
        }
        const phagosome = this.entities["phagosome"];
        if (phagosome) {
            // Phagosome forms gradually
            const targetScale = Math.min(1, t * 3) * 0.35;
            phagosome.scale.setScalar(this._lerp(phagosome.scale.x, Math.max(0.01, targetScale), 0.08));

            // Membrane wobble as it pinches off
            const wobble = 1 + Math.sin(t * Math.PI * 8) * 0.08;
            phagosome.scale.multiplyScalar(wobble);

            // Glow while forming
            const glow = Math.sin(t * Math.PI) * 0.3;
            phagosome.children.forEach(child => {
                if (child.material) {
                    child.material.emissive = new THREE.Color(0x66bb6a);
                    child.material.emissiveIntensity = glow;
                }
            });
        }
    }

    _effectFuseLysosomes(t) {
        const macrophage = this.entities["macrophage"];
        const phagosome = this.entities["phagosome"];

        // Phase 1 (0-0.4): Lysosomes move toward phagosome
        // Phase 2 (0.4-0.7): First lysosome fuses
        // Phase 3 (0.7-1.0): Phagolysosome forms

        if (macrophage) {
            macrophage.children.forEach(child => {
                if (child.name.startsWith("Lysosome")) {
                    if (t < 0.4) {
                        // Move lysosomes toward center (phagosome location)
                        const moveT = t / 0.4;
                        const targetPos = new THREE.Vector3(0, 0, 0);
                        child.position.lerp(targetPos, moveT * 0.08);

                        // Lysosomes glow as they approach
                        if (child.material) {
                            child.material.emissive = new THREE.Color(0xfdd835);
                            child.material.emissiveIntensity = moveT * 0.5;
                        }
                    } else if (t < 0.7) {
                        // Fusion animation - lysosome merges with phagosome
                        const fuseT = (t - 0.4) / 0.3;
                        child.scale.setScalar(this._lerp(1, 0.1, fuseT));
                        child.position.lerp(new THREE.Vector3(0, 0, 0), 0.15);
                    } else {
                        child.visible = false;
                    }
                }
            });
        }

        // Phagolysosome forms after fusion
        if (!this.entities["phagolysosome"] && t > 0.5) {
            const pl = AssetLibrary.createAsset("phagolysosome");
            pl.position.set(0, 0, 0);
            pl.scale.setScalar(0.01);
            this.scene.add(pl);
            this.entities["phagolysosome"] = pl;
        }
        const pl = this.entities["phagolysosome"];
        if (pl) {
            const targetScale = Math.min(1, (t - 0.5) * 3) * 0.4;
            pl.scale.setScalar(this._lerp(pl.scale.x, Math.max(0.01, targetScale), 0.08));

            // Acidic glow
            const glow = 0.3 + Math.sin(t * Math.PI * 8) * 0.2;
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = glow;
                glowMesh.scale.setScalar(1 + Math.sin(t * Math.PI * 6) * 0.1);
            }

            // pH indicator - color shifts from yellow to orange as acidifies
            pl.children.forEach(child => {
                if (child.material && child.name !== "Glow") {
                    const acidT = Math.min(1, (t - 0.5) * 2.5);
                    child.material.color.setHex(this._lerp(0x7cb342, 0xcc7a00, acidT));
                }
            });
        }
    }

    _effectDestroy(t) {
        const pl = this.entities["phagolysosome"];
        if (!pl) return;

        // Phase 1 (0-0.3): ROS burst
        // Phase 2 (0.3-0.7): Enzymatic degradation
        // Phase 3 (0.7-1.0): Fragmentation complete

        // ROS burst effect
        if (t < 0.3) {
            const burstT = t / 0.3;
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = 0.4 + burstT * 0.4;
                glowMesh.material.color.setHex(0xffff00);
                glowMesh.scale.setScalar(1 + burstT * 0.3);
            }

            // Phagolysosome vibrates during burst
            pl.position.x = Math.sin(t * Math.PI * 20) * 0.05;
            pl.position.z = Math.cos(t * Math.PI * 20) * 0.05;
        } else if (t < 0.7) {
            // Digestion - internal degradation visualized
            const digestT = (t - 0.3) / 0.4;
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = 0.3 + Math.sin(t * Math.PI * 12) * 0.2;
                glowMesh.material.color.setHex(0xff8800);
            }

            // Pulsing indicating enzymatic activity
            const pulse = 1 + Math.sin(t * Math.PI * 10) * 0.1;
            pl.scale.setScalar(0.4 * pulse);

            pl.position.x = Math.sin(t * Math.PI * 10) * 0.03;
            pl.position.z = Math.cos(t * Math.PI * 10) * 0.03;
        } else {
            // Fragmentation - phagolysosome shrinks as contents are cleared
            const clearT = (t - 0.7) / 0.3;
            const scale = this._lerp(0.4, 0.15, clearT);
            pl.scale.setScalar(scale);

            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = this._lerp(0.3, 0, clearT);
            }

            // Slight drift as debris is cleared
            pl.position.y = this._lerp(0, -0.2, clearT);
        }
    }

    _effectBacteriumSwim(t, localTime) {
        const bacterium = this.entities["bacterium"];
        if (!bacterium) return;

        // Realistic wavy swimming motion
        bacterium.position.y = Math.sin(localTime * 3) * 0.3;
        bacterium.position.z = Math.cos(localTime * 2) * 0.2;

        // Flagellum wave
        bacterium.rotation.z = Math.sin(localTime * 4) * 0.15;

        // Slowly approach macrophage
        bacterium.position.x = this._lerp(bacterium.position.x, 2.5, 0.003);

        // Rotate slightly
        bacterium.rotation.y += 0.01;
    }

    _effectMacrophagePatrol(t, localTime) {
        const macrophage = this.entities["macrophage"];
        if (!macrophage) return;

        // Gentle floating/patrolling motion
        macrophage.position.x = Math.sin(localTime * 0.5) * 0.5;
        macrophage.position.y = Math.sin(localTime * 0.8) * 0.15;
        macrophage.rotation.y = Math.sin(localTime * 0.3) * 0.2;

        // Membrane undulation - pseudopods wave gently
        macrophage.children.forEach((child, i) => {
            if (child.userData.isPseudopod) {
                child.scale.y = 1 + Math.sin(localTime * 2 + i) * 0.15;
                child.position.y = Math.sin(localTime * 1.5 + i * 0.5) * 0.05;
            }
        });

        // Lysosomes drift inside
        macrophage.children.forEach(child => {
            if (child.name.startsWith("Lysosome")) {
                child.position.x += Math.sin(localTime + parseFloat(child.name.split("_")[1]) * 2) * 0.002;
                child.position.z += Math.cos(localTime + parseFloat(child.name.split("_")[1]) * 2) * 0.002;
            }
        });
    }

    _effectHighlight(organellePrefix, t) {
        const cell = this.entities["human_cell"];
        if (!cell) return;
        const pulse = 0.5 + Math.sin(t * Math.PI * 4) * 0.5;
        cell.children.forEach(child => {
            if (child.name.startsWith(organellePrefix)) {
                if (child.material) {
                    child.material.emissive = new THREE.Color(0xffffff);
                    child.material.emissiveIntensity = pulse * 0.5;
                }
                const s = 1 + pulse * 0.1;
                child.scale.setScalar(s);
            }
        });
    }

    _resetEntities() {
        for (const [id, entity] of Object.entries(this.entities)) {
            if (id === "dr_doom") {
                entity.position.set(-3, 0, 2);
                entity.rotation.set(0, 0, 0);
                continue;
            }
            switch (id) {
                case "macrophage": case "human_cell":
                    entity.position.set(0, 0, 0); entity.scale.setScalar(1); entity.rotation.set(0, 0, 0); break;
                case "bacterium":
                    entity.position.set(8, 0, 0); entity.scale.setScalar(1); entity.rotation.set(0, 0, 0); entity.visible = true; break;
                case "phagosome": case "phagolysosome":
                    this.scene.remove(entity); delete this.entities[id]; break;
            }
            entity.children.forEach(child => {
                if (child.material) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                    child.material.opacity = child.material.userData?.originalOpacity || child.material.opacity;
                    child.visible = true;
                }
                child.scale.set(1, 1, 1);
                if (child.userData.isPseudopod) {
                    child.scale.set(1, 1, 1);
                    child.rotation.set(0, 0, 0);
                }
            });
        }
    }

    // ============ CAMERA ============

    _updateCamera(delta) {
        const x = Math.cos(this.cameraAngle) * this.cameraDistance;
        const z = Math.sin(this.cameraAngle) * this.cameraDistance;
        const y = this.cameraDistance * 0.4;
        this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.04);
        this.camera.lookAt(this.cameraTarget);
    }

    // ============ INTERACTION ============

    onClick(event) {
        const rect = this.viewport.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this._checkIntersection();
    }

    onTouch(event) {
        if (event.changedTouches.length === 0) return;
        const t = event.changedTouches[0];
        const rect = this.viewport.getBoundingClientRect();
        this.mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
        this._checkIntersection();
    }

    _checkIntersection() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const meshes = [];
        for (const entity of Object.values(this.entities)) {
            entity.traverse(child => { if (child.isMesh) meshes.push(child); });
        }
        const intersects = this.raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && !obj.userData.entityId) obj = obj.parent;
            if (obj && obj.userData.entityId && obj.userData.entityId !== "dr_doom" && this.onEntityClick) {
                const data = MedicalKnowledge.getEntity(obj.userData.entityId);
                if (data) this.onEntityClick(data, intersects[0].point);
                VoiceManager.playClickSound();
            }
        }
    }

    onResize() {
        const w = this.viewport.clientWidth, h = this.viewport.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    getProgress() { return this.currentRecipe ? this.elapsedTime / this.currentRecipe.duration : 0; }
    getElapsed() { return this.elapsedTime; }
    getTotalDuration() { return this.currentRecipe?.duration || 0; }
}
