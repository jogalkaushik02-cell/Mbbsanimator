// ============================================
// Animation Engine - Professional 3D
// Smooth transitions, particles, post-processing
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
        this.targetCameraDistance = 15;
        this.targetCameraAngle = 0;
        this.targetCameraTarget = new THREE.Vector3(0, 0, 0);
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
        this.transitionOverlay = null;
        this.particles = [];
        this.bloomPass = null;
        this.sceneFog = null;
        this._createLabelOverlay();
        this._createTransitionOverlay();
        this.init();
    }

    _createLabelOverlay() {
        this.labelContainer = document.createElement("div");
        this.labelContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;font-family:'Segoe UI',system-ui,sans-serif;";
        this.viewport.style.position = "relative";
        this.viewport.appendChild(this.labelContainer);
    }

    _createTransitionOverlay() {
        this.transitionOverlay = document.createElement("div");
        this.transitionOverlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;background:black;opacity:0;transition:opacity 0.5s ease;";
        this.viewport.appendChild(this.transitionOverlay);
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
                div.style.cssText += "top:12px;left:50%;transform:translateX(-50%);background:rgba(10,22,40,0.9);border:1px solid rgba(79,195,247,0.6);border-radius:10px;padding:8px 18px;color:#4fc3f7;font-size:14px;font-weight:700;letter-spacing:0.8px;white-space:nowrap;text-shadow:0 0 12px rgba(79,195,247,0.5);box-shadow:0 4px 20px rgba(79,195,247,0.3);";
            } else {
                div.style.cssText += `left:${Math.max(10, Math.min(vw - 120, x))}px;top:${Math.max(10, Math.min(vh - 30, y - 15))}px;background:rgba(10,22,40,0.85);border:1px solid rgba(100,180,255,0.4);border-radius:6px;padding:4px 10px;color:#8ec8f0;font-size:12px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.3);`;
                div.style.cssText += "font-weight:500;";
            }
            div.textContent = label.text;
            this.labelContainer.appendChild(div);
        }
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a1628, 0.015);
        const aspect = this.viewport.clientWidth / this.viewport.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.viewport.clientWidth, this.viewport.clientHeight);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setClearColor(0x0a1628, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.viewport.appendChild(this.renderer.domElement);

        // Professional lighting setup
        const ambientLight = new THREE.AmbientLight(0x334466, 0.4);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 12, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -15;
        keyLight.shadow.camera.right = 15;
        keyLight.shadow.camera.top = 15;
        keyLight.shadow.camera.bottom = -15;
        keyLight.shadow.bias = -0.001;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x4488aa, 0.5);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x6699cc, 0.3);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);

        const groundLight = new THREE.PointLight(0x224466, 0.3, 20);
        groundLight.position.set(0, -2, 0);
        this.scene.add(groundLight);

        this._createBackground();
        this._createGroundPlane();
        window.addEventListener("resize", () => this.onResize());
        this.viewport.addEventListener("click", (e) => this.onClick(e));
        this.viewport.addEventListener("touchend", (e) => this.onTouch(e));
        this._setupDragControls();
        this.animate();
    }

    _createBackground() {
        const starsGeo = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        for (let i = 0; i < this.starCount; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            positions.push(x, y, z);
            const brightness = 0.3 + Math.random() * 0.7;
            colors.push(0.3 * brightness, 0.4 * brightness, 0.6 * brightness);
        }
        starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        starsGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.8 });
        this.scene.add(new THREE.Points(starsGeo, starsMat));
    }

    _createGroundPlane() {
        const groundGeo = new THREE.CircleGeometry(20, 64);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x0a1628,
            metalness: 0.3,
            roughness: 0.8,
            transparent: true,
            opacity: 0.5
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid lines for depth perception
        const gridHelper = new THREE.GridHelper(20, 20, 0x1a3050, 0x0d1f35);
        gridHelper.position.y = -1.99;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.scene.add(gridHelper);
    }

    _setupDragControls() {
        let isDragging = false, prevX = 0;
        this.viewport.addEventListener("mousedown", (e) => { isDragging = true; prevX = e.clientX; });
        window.addEventListener("mousemove", (e) => { if (isDragging) { this.targetCameraAngle += (e.clientX - prevX) * 0.005; prevX = e.clientX; }});
        window.addEventListener("mouseup", () => isDragging = false);
        this.viewport.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { isDragging = true; prevX = e.touches[0].clientX; }});
        window.addEventListener("touchmove", (e) => { if (isDragging && e.touches.length === 1) { this.targetCameraAngle += (e.touches[0].clientX - prevX) * 0.005; prevX = e.touches[0].clientX; }});
        window.addEventListener("touchend", () => isDragging = false);
    }

    // ============ PROFESSIONAL EASING FUNCTIONS ============
    // These make animations look smooth and professional

    _lerp(a, b, t) { return a + (b - a) * t; }
    _lerpVec3(a, b, t) { return new THREE.Vector3(this._lerp(a.x, b.x, t), this._lerp(a.y, b.y, t), this._lerp(a.z, b.z, t)); }
    _lerpColor(a, b, t) { return new THREE.Color(this._lerp(a.r, b.r, t), this._lerp(a.g, b.g, t), this._lerp(a.b, b.b, t)); }

    // Professional easing curves
    _easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    _easeInCubic(t) { return t * t * t; }
    _easeInOutQuart(t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; }
    _easeOutBack(t) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
    _easeOutElastic(t) { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; }
    _easeOutBounce(t) { const n1 = 7.5625; const d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; else return n1 * (t -= 2.625 / d1) * t + 0.984375; }

    // Smooth camera path with Catmull-Rom spline
    _spline(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    }

    // ============ PARTICLE SYSTEM ============

    _spawnParticles(position, count, color, size, speed, lifetime) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            );
            particle.userData.lifetime = lifetime;
            particle.userData.age = 0;
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    _updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.userData.age += delta;
            if (p.userData.age >= p.userData.lifetime) {
                this.scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
            p.userData.velocity.y -= 0.5 * delta; // gravity
            const lifeRatio = 1 - (p.userData.age / p.userData.lifetime);
            p.material.opacity = lifeRatio;
            p.scale.setScalar(lifeRatio);
        }
    }

    // ============ SCENE TRANSITIONS ============

    _fadeTransition(callback, duration = 0.5) {
        if (!this.transitionOverlay) { callback(); return; }
        this.transitionOverlay.style.transition = `opacity ${duration}s ease`;
        this.transitionOverlay.style.opacity = "1";
        setTimeout(() => {
            callback();
            this.transitionOverlay.style.opacity = "0";
        }, duration * 1000);
    }

    _flashTransition(color = 0xffffff, duration = 0.3) {
        if (!this.transitionOverlay) return;
        this.transitionOverlay.style.background = `#${color.toString(16).padStart(6, '0')}`;
        this.transitionOverlay.style.transition = `opacity ${duration}s ease`;
        this.transitionOverlay.style.opacity = "0.8";
        setTimeout(() => { this.transitionOverlay.style.opacity = "0"; }, duration * 500);
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

        // Dr. Doom
        const drDoom = AssetLibrary.createAsset("dr_doom");
        drDoom.position.set(-3, 0, 2);
        drDoom.scale.setScalar(1.2);
        this.scene.add(drDoom);
        this.entities["dr_doom"] = drDoom;

        // Spawn recipe entities with positions
        const positions = storyboard?.scenes?.[0]?.positions || {};
        for (const entityId of recipe.entities) {
            const asset = AssetLibrary.createAsset(entityId);
            if (asset) {
                const pos = positions[entityId] || { x: 0, y: 0, z: 0 };
                asset.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
                asset.castShadow = true;
                asset.receiveShadow = true;
                this.scene.add(asset);
                this.entities[entityId] = asset;
            }
        }

        const firstScene = this.currentStoryboard?.scenes?.[0];
        this.targetCameraDistance = firstScene?.camera?.distance || recipe.steps[0]?.camera?.distance || 15;
        this.targetCameraAngle = firstScene?.camera?.angle || recipe.steps[0]?.camera?.angle || 0;
        this.cameraDistance = this.targetCameraDistance;
        this.cameraAngle = this.targetCameraAngle;
    }

    clearScene() {
        for (const key in this.entities) {
            this.scene.remove(this.entities[key]);
            delete this.entities[key];
        }
        this.particles.forEach(p => { this.scene.remove(p); p.geometry.dispose(); p.material.dispose(); });
        this.particles = [];
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
    zoom(d) { this.targetCameraDistance = Math.max(5, Math.min(30, this.targetCameraDistance + d)); }

    // ============ MAIN ANIMATION LOOP ============

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.05);
        if (this.isPlaying && !this.isPaused && this.currentRecipe) {
            this._update(delta);
        }
        this._animateDrDoom(delta);
        this._updateCamera(delta);
        this._updateParticles(delta);
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

        let accumulated = 0;
        for (let i = 0; i < this.currentRecipe.steps.length; i++) {
            const step = this.currentRecipe.steps[i];
            if (this.elapsedTime < accumulated + step.duration) {
                if (this.currentStepIndex !== i) {
                    // Scene transition
                    const prevStep = this.currentStepIndex;
                    this.currentStepIndex = i;
                    if (prevStep >= 0 && i > prevStep) {
                        this._flashTransition(0x4fc3f7, 0.2);
                    }
                    if (this.onStepChange) this.onStepChange(step, i);
                    if (step.narration && this.onNarration) this.onNarration(step.narration);
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

    _processStepSmooth(step, t, localTime) {
        const et = this._easeInOutCubic(t);

        // Camera movement with smooth easing
        const sceneData = this.currentStoryboard?.scenes?.[this.currentStepIndex];
        const camData = sceneData?.camera || step.camera;
        if (camData) {
            this.targetCameraDistance = camData.distance;
            this.targetCameraAngle = camData.angle;
            if (camData.target) {
                this.targetCameraTarget.set(camData.target[0] || 0, camData.target[1] || 0, camData.target[2] || 0);
            }
        }

        if (!step.effect) return;

        switch (step.effect) {
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

    _animateDrDoomExplain(t) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;
        doc.rotation.y = Math.sin(t * Math.PI * 2) * 0.15;
        doc.position.y = Math.sin(t * Math.PI * 3) * 0.05;
        const rightArm = doc.getObjectByName("RightArm");
        if (rightArm) {
            rightArm.rotation.z = -0.5 + Math.sin(t * Math.PI * 4) * 0.4;
            rightArm.rotation.x = Math.sin(t * Math.PI * 3) * 0.2;
        }
        const rightHand = doc.getObjectByName("RightHand");
        if (rightHand) {
            rightHand.position.y = 0.45 + Math.sin(t * Math.PI * 4) * 0.15;
            rightHand.position.x = 0.48 + Math.sin(t * Math.PI * 4) * 0.1;
        }
        const pen = doc.getObjectByName("Pen");
        if (pen) { pen.rotation.x = Math.sin(t * Math.PI * 5) * 0.1; }
        const head = doc.getObjectByName("Head");
        if (head) { head.rotation.x = Math.sin(t * Math.PI * 2) * 0.05; }
    }

    _animateDrDoomPoint(t, target) {
        const doc = this.entities["dr_doom"];
        if (!doc || !target) return;
        const dir = new THREE.Vector3().subVectors(target.position, doc.position).normalize();
        const targetAngle = Math.atan2(dir.x, dir.z);
        doc.rotation.y = this._lerp(doc.rotation.y, targetAngle, 0.05);
        const rightArm = doc.getObjectByName("RightArm");
        if (rightArm) {
            rightArm.rotation.z = this._lerp(rightArm.rotation.z, -1.2 + Math.sin(t * Math.PI * 2) * 0.15, 0.08);
            rightArm.rotation.x = this._lerp(rightArm.rotation.x, -0.3, 0.08);
        }
        const rightHand = doc.getObjectByName("RightHand");
        if (rightHand) {
            rightHand.position.x = this._lerp(rightHand.position.x, 0.7, 0.06);
            rightHand.position.y = this._lerp(rightHand.position.y, 0.8, 0.06);
            rightHand.position.z = this._lerp(rightHand.position.z, 0.3, 0.06);
        }
        const pen = doc.getObjectByName("Pen");
        if (pen) {
            pen.position.x = this._lerp(pen.position.x, 0.72, 0.06);
            pen.position.y = this._lerp(pen.position.y, 0.9, 0.06);
        }
        doc.position.x = this._lerp(doc.position.x, target.position.x - 3, 0.03);
        doc.position.z = this._lerp(doc.position.z, target.position.z + 2, 0.03);
    }

    _animateDrDoomWrite(t) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;
        const pen = doc.getObjectByName("Pen");
        if (pen) {
            pen.position.x = -0.5 + Math.sin(t * Math.PI * 8) * 0.08;
            pen.position.y = 0.55 + Math.cos(t * Math.PI * 6) * 0.04;
            pen.rotation.z = 0.3 + Math.sin(t * Math.PI * 8) * 0.15;
        }
        const leftArm = doc.getObjectByName("LeftArm");
        if (leftArm) { leftArm.rotation.z = 0.5 + Math.sin(t * Math.PI * 8) * 0.1; }
        const head = doc.getObjectByName("Head");
        if (head) { head.rotation.z = Math.sin(t * Math.PI * 4) * 0.08; head.rotation.x = -0.1; }
    }

    _animateDrDoomAngry(t) {
        const doc = this.entities["dr_doom"];
        if (!doc) return;
        doc.rotation.z = Math.sin(t * Math.PI * 12) * 0.05;
        doc.position.y = Math.abs(Math.sin(t * Math.PI * 6)) * 0.1;
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
            entity.position.y += Math.sin(time * 1.2 + entity.id) * 0.001;
            if (id === "virus" || id === "dna" || id === "antibody") { entity.rotation.y += 0.005; }
            if (id === "heart") { const beat = 1 + Math.sin(time * 4) * 0.03; entity.scale.setScalar(beat); }
            if (id === "red_blood_cell") { entity.rotation.x += 0.003; entity.position.y += Math.sin(time * 2) * 0.002; }
            if (id === "neuron") {
                entity.children.forEach(child => {
                    if (child.name === "Nucleus") {
                        child.material.emissive = new THREE.Color(0xffd700);
                        child.material.emissiveIntensity = 0.2 + Math.sin(time * 3) * 0.15;
                    }
                });
            }
            if (id === "cancer_cell") { entity.rotation.y += 0.008; entity.rotation.x += 0.004; }
            if (id === "brain") { entity.rotation.y = Math.sin(time * 0.3) * 0.05; }
            if (id === "stem_cell") {
                const glow = entity.getObjectByName("Glow");
                if (glow && glow.material) { glow.material.opacity = 0.08 + Math.sin(time * 2) * 0.05; }
            }
        }
    }

    // ============ BIOLOGICAL EFFECTS ============

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
        const dir = new THREE.Vector3().subVectors(bacterium.position, macrophage.position).normalize();
        macrophage.children.forEach((child, i) => {
            if (child.userData.isPseudopod) {
                const podDir = new THREE.Vector3(Math.cos((i / 4) * Math.PI * 2 + Math.PI / 4), 0, Math.sin((i / 4) * Math.PI * 2 + Math.PI / 4));
                const alignment = podDir.dot(dir);
                const extensionFactor = Math.max(0, alignment) * t * 2.5;
                const baseExtension = t * 0.8;
                child.scale.y = 1 + baseExtension + extensionFactor;
                child.position.x = Math.cos((i / 4) * Math.PI * 2 + Math.PI / 4) * (0.9 + extensionFactor * 0.3);
                child.position.z = Math.sin((i / 4) * Math.PI * 2 + Math.PI / 4) * (0.9 + extensionFactor * 0.3);
                if (extensionFactor > 0.5) {
                    child.rotation.z = this._lerp(child.rotation.z, -dir.x * 0.8, 0.05);
                    child.rotation.x = this._lerp(child.rotation.x, dir.z * 0.8, 0.05);
                }
            }
        });
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
        if (t < 0.3) {
            const slideT = t / 0.3;
            bacterium.position.x = this._lerp(2.5, 1.2, slideT);
            bacterium.position.y = this._lerp(0, 0.2, Math.sin(slideT * Math.PI));
            bacterium.rotation.z += 0.02;
        } else if (t < 0.7) {
            const cupT = (t - 0.3) / 0.4;
            bacterium.position.x = this._lerp(1.2, 0.3, cupT);
            bacterium.position.y = this._lerp(0.2, 0, cupT);
            bacterium.rotation.y += 0.04;
            bacterium.rotation.z += 0.03;
            const s = this._lerp(1, 0.6, cupT);
            bacterium.scale.setScalar(Math.max(0.3, s));
        } else {
            const closeT = (t - 0.7) / 0.3;
            bacterium.position.x = this._lerp(0.3, 0, closeT);
            bacterium.position.y = 0;
            bacterium.rotation.y += 0.05;
            const s = this._lerp(0.6, 0.3, closeT);
            bacterium.scale.setScalar(Math.max(0.15, s));
        }
        if (macrophage && t > 0.5) {
            const closeProgress = (t - 0.5) / 0.5;
            macrophage.children.forEach((child, i) => {
                if (child.userData.isPseudopod) {
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
            if (this.entities["bacterium"]) { this.entities["bacterium"].visible = false; }
            // Particle burst when phagosome forms
            this._spawnParticles(new THREE.Vector3(0, 0, 0), 15, 0x66bb6a, 0.05, 2, 1);
        }
        const phagosome = this.entities["phagosome"];
        if (phagosome) {
            const targetScale = Math.min(1, t * 3) * 0.35;
            phagosome.scale.setScalar(this._lerp(phagosome.scale.x, Math.max(0.01, targetScale), 0.08));
            const wobble = 1 + Math.sin(t * Math.PI * 8) * 0.08;
            phagosome.scale.multiplyScalar(wobble);
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
        if (macrophage) {
            macrophage.children.forEach(child => {
                if (child.name.startsWith("Lysosome")) {
                    if (t < 0.4) {
                        const moveT = t / 0.4;
                        child.position.lerp(new THREE.Vector3(0, 0, 0), moveT * 0.08);
                        if (child.material) {
                            child.material.emissive = new THREE.Color(0xfdd835);
                            child.material.emissiveIntensity = moveT * 0.5;
                        }
                    } else if (t < 0.7) {
                        const fuseT = (t - 0.4) / 0.3;
                        child.scale.setScalar(this._lerp(1, 0.1, fuseT));
                        child.position.lerp(new THREE.Vector3(0, 0, 0), 0.15);
                    } else {
                        child.visible = false;
                    }
                }
            });
        }
        if (!this.entities["phagolysosome"] && t > 0.5) {
            const pl = AssetLibrary.createAsset("phagolysosome");
            pl.position.set(0, 0, 0);
            pl.scale.setScalar(0.01);
            this.scene.add(pl);
            this.entities["phagolysosome"] = pl;
            this._spawnParticles(new THREE.Vector3(0, 0, 0), 20, 0xfdd835, 0.04, 1.5, 0.8);
        }
        const pl = this.entities["phagolysosome"];
        if (pl) {
            const targetScale = Math.min(1, (t - 0.5) * 3) * 0.4;
            pl.scale.setScalar(this._lerp(pl.scale.x, Math.max(0.01, targetScale), 0.08));
            const glow = 0.3 + Math.sin(t * Math.PI * 8) * 0.2;
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = glow;
                glowMesh.scale.setScalar(1 + Math.sin(t * Math.PI * 6) * 0.1);
            }
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
        if (t < 0.3) {
            const burstT = t / 0.3;
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = 0.4 + burstT * 0.4;
                glowMesh.material.color.setHex(0xffff00);
                glowMesh.scale.setScalar(1 + burstT * 0.3);
            }
            pl.position.x = Math.sin(t * Math.PI * 20) * 0.05;
            pl.position.z = Math.cos(t * Math.PI * 20) * 0.05;
            // ROS particle burst
            if (t > 0.1 && t < 0.15) {
                this._spawnParticles(new THREE.Vector3(0, 0, 0), 30, 0xffff00, 0.03, 3, 1.2);
            }
        } else if (t < 0.7) {
            const digestT = (t - 0.3) / 0.4;
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = 0.3 + Math.sin(t * Math.PI * 12) * 0.2;
                glowMesh.material.color.setHex(0xff8800);
            }
            const pulse = 1 + Math.sin(t * Math.PI * 10) * 0.1;
            pl.scale.setScalar(0.4 * pulse);
            pl.position.x = Math.sin(t * Math.PI * 10) * 0.03;
            pl.position.z = Math.cos(t * Math.PI * 10) * 0.03;
        } else {
            const clearT = (t - 0.7) / 0.3;
            const scale = this._lerp(0.4, 0.15, clearT);
            pl.scale.setScalar(scale);
            const glowMesh = pl.getObjectByName("Glow");
            if (glowMesh && glowMesh.material) {
                glowMesh.material.opacity = this._lerp(0.3, 0, clearT);
            }
            pl.position.y = this._lerp(0, -0.2, clearT);
        }
    }

    _effectBacteriumSwim(t, localTime) {
        const bacterium = this.entities["bacterium"];
        if (!bacterium) return;
        bacterium.position.y = Math.sin(localTime * 3) * 0.3;
        bacterium.position.z = Math.cos(localTime * 2) * 0.2;
        bacterium.rotation.z = Math.sin(localTime * 4) * 0.15;
        bacterium.position.x = this._lerp(bacterium.position.x, 2.5, 0.003);
        bacterium.rotation.y += 0.01;
    }

    _effectMacrophagePatrol(t, localTime) {
        const macrophage = this.entities["macrophage"];
        if (!macrophage) return;
        macrophage.position.x = Math.sin(localTime * 0.5) * 0.5;
        macrophage.position.y = Math.sin(localTime * 0.8) * 0.15;
        macrophage.rotation.y = Math.sin(localTime * 0.3) * 0.2;
        macrophage.children.forEach((child, i) => {
            if (child.userData.isPseudopod) {
                child.scale.y = 1 + Math.sin(localTime * 2 + i) * 0.15;
                child.position.y = Math.sin(localTime * 1.5 + i * 0.5) * 0.05;
            }
        });
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
    // Professional smooth camera with easing

    _updateCamera(delta) {
        // Smooth interpolation toward target
        const lerpFactor = 1 - Math.pow(0.01, delta);
        this.cameraDistance = this._lerp(this.cameraDistance, this.targetCameraDistance, lerpFactor);
        this.cameraAngle = this._lerp(this.cameraAngle, this.targetCameraAngle, lerpFactor);
        this.cameraTarget.lerp(this.targetCameraTarget, lerpFactor);

        const x = Math.cos(this.cameraAngle) * this.cameraDistance;
        const z = Math.sin(this.cameraAngle) * this.cameraDistance;
        const y = this.cameraDistance * 0.4;
        this.camera.position.lerp(new THREE.Vector3(x, y, z), lerpFactor * 0.8);
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
