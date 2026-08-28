// ============================================
// Animation Engine - SMOOTH Keyframe Interpolation
// Real animations, not slideshows
// ============================================

class AnimationEngine {
    constructor(viewportElement) {
        this.viewport = viewportElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.entities = {};
        this.currentRecipe = null;
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
        this.init();
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

    // ============ LOAD RECIPE ============

    loadRecipe(recipe) {
        this.clearScene();
        this.currentRecipe = recipe;
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

        this.cameraDistance = recipe.steps[0]?.camera?.distance || 15;
        this.cameraAngle = recipe.steps[0]?.camera?.angle || 0;
    }

    clearScene() {
        for (const key in this.entities) {
            this.scene.remove(this.entities[key]);
            delete this.entities[key];
        }
        this.currentRecipe = null;
        this.currentStepIndex = -1;
    }

    // ============ PLAYBACK ============

    play() { if (!this.currentRecipe) return; this.isPlaying = true; this.isPaused = false; VoiceManager.playClickSound(); }
    pause() { this.isPaused = true; VoiceManager.playClickSound(); }
    resume() { this.isPaused = false; }
    replay() { this.elapsedTime = 0; this.currentStepIndex = -1; this.isPlaying = true; this.isPaused = false; this._resetEntities(); VoiceManager.playClickSound(); }
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

        // Camera movement - smooth orbit + zoom
        if (step.camera) {
            const targetDist = step.camera.distance;
            const targetAngle = step.camera.angle;
            this.cameraDistance = this._lerp(this.cameraDistance, targetDist, 0.02);
            this.cameraAngle = this._lerp(this.cameraAngle, targetAngle, 0.02);
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

        // Idle breathing
        const time = this.clock.elapsedTime;
        doc.position.y = Math.sin(time * 1.5) * 0.03;

        // Subtle arm idle
        if (!this.isPlaying) {
            const rightArm = doc.getObjectByName("RightArm");
            if (rightArm) {
                rightArm.rotation.z = -0.5 + Math.sin(time * 2) * 0.1;
            }
        }
    }

    // ============ BIOLOGICAL EFFECTS (SMOOTH) ============

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
        if (!macrophage) return;
        macrophage.children.forEach(child => {
            if (child.userData.isPseudopod) {
                const scale = 1 + t * 1.2;
                child.scale.set(this._lerp(child.scale.x, scale, 0.1), 1, this._lerp(child.scale.z, scale, 0.1));
            }
        });
    }

    _effectEngulf(t) {
        const bacterium = this.entities["bacterium"];
        if (!bacterium) return;
        // Smooth curve path toward macrophage
        const startX = 8, endX = 0;
        const startY = 0, peakY = 1.5;
        const x = startX + (endX - startX) * t;
        const y = peakY * Math.sin(t * Math.PI);
        bacterium.position.set(x, y, 0);
        // Smooth scale down
        const scale = this._lerp(1, 0.4, t);
        bacterium.scale.setScalar(Math.max(0.15, scale));
        // Rotate while entering
        bacterium.rotation.y += 0.03;
        bacterium.rotation.z += 0.02;
    }

    _effectFormPhagosome(t) {
        if (!this.entities["phagosome"] && t > 0.2) {
            const phagosome = AssetLibrary.createAsset("phagosome");
            phagosome.position.set(0, 0, 0);
            phagosome.scale.setScalar(0.01);
            this.scene.add(phagosome);
            this.entities["phagosome"] = phagosome;
        }
        const phagosome = this.entities["phagosome"];
        if (phagosome) {
            const targetScale = Math.min(1, t * 2.5) * 0.3;
            phagosome.scale.setScalar(this._lerp(phagosome.scale.x, Math.max(0.01, targetScale), 0.1));
            // Gentle pulse
            const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.05;
            phagosome.scale.multiplyScalar(pulse);
        }
    }

    _effectFuseLysosomes(t) {
        const macrophage = this.entities["macrophage"];
        if (macrophage) {
            macrophage.children.forEach(child => {
                if (child.name.startsWith("Lysosome")) {
                    // Smoothly move lysosomes toward center
                    if (t < 0.5) {
                        child.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
                    } else {
                        child.visible = false;
                    }
                }
            });
        }
        if (!this.entities["phagolysosome"] && t > 0.4) {
            const pl = AssetLibrary.createAsset("phagolysosome");
            pl.position.set(0, 0, 0);
            pl.scale.setScalar(0.01);
            this.scene.add(pl);
            this.entities["phagolysosome"] = pl;
        }
        const pl = this.entities["phagolysosome"];
        if (pl) {
            const targetScale = Math.min(1, (t - 0.4) * 2) * 0.35;
            pl.scale.setScalar(this._lerp(pl.scale.x, Math.max(0.01, targetScale), 0.1));
            const pulse = 1 + Math.sin(t * Math.PI * 6) * 0.08;
            pl.scale.multiplyScalar(pulse);
        }
    }

    _effectDestroy(t) {
        const bacterium = this.entities["bacterium"];
        if (bacterium) {
            const scale = this._lerp(0.15, 0, t);
            bacterium.scale.setScalar(Math.max(0.001, scale));
            bacterium.rotation.x += 0.08;
            bacterium.rotation.y += 0.12;
            bacterium.rotation.z += 0.06;
            bacterium.children.forEach(child => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 1 - t;
                }
            });
            // Dr. Doom celebrates
            if (t > 0.5) this._animateDrDoomAngry(t - 0.5);
        }
        const pl = this.entities["phagolysosome"];
        if (pl) {
            const glow = pl.getObjectByName("Glow");
            if (glow && glow.material) {
                glow.material.opacity = 0.3 + Math.sin(t * Math.PI * 8) * 0.25;
                glow.scale.setScalar(1 + Math.sin(t * Math.PI * 6) * 0.15);
            }
        }
    }

    _effectBacteriumSwim(t, localTime) {
        const bacterium = this.entities["bacterium"];
        if (!bacterium) return;
        // Wavy swimming motion
        bacterium.position.y = Math.sin(localTime * 3) * 0.3;
        bacterium.position.z = Math.cos(localTime * 2) * 0.2;
        bacterium.rotation.z = Math.sin(localTime * 4) * 0.15;
        // Slowly approach
        bacterium.position.x = this._lerp(bacterium.position.x, 3, 0.005);
    }

    _effectMacrophagePatrol(t, localTime) {
        const macrophage = this.entities["macrophage"];
        if (!macrophage) return;
        // Gentle floating/patrolling motion
        macrophage.position.x = Math.sin(localTime * 0.5) * 0.5;
        macrophage.position.y = Math.sin(localTime * 0.8) * 0.15;
        macrophage.rotation.y = Math.sin(localTime * 0.3) * 0.2;
        // Membrane undulation
        macrophage.children.forEach(child => {
            if (child.name === "Pseudopod_0" || child.name === "Pseudopod_2") {
                child.scale.y = 1 + Math.sin(localTime * 2) * 0.15;
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
                // Subtle size pulse
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
                    entity.position.set(8, 0, 0); entity.scale.setScalar(1); entity.rotation.set(0, 0, 0); break;
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
                if (child.userData.isPseudopod) child.scale.set(1, 1, 1);
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
