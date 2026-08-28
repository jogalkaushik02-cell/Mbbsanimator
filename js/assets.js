// ============================================
// 3D Asset Library - Procedural Medical Models
// Smooth animated models + Dr. Doom character
// ============================================

const AssetLibrary = {

    // ============ DR. DOOM - TEACHING CHARACTER ============
    createDrDoom() {
        const group = new THREE.Group();
        group.userData = { entityId: "dr_doom", clickable: true, isDoctor: true };

        // Body (lab coat - white cylinder)
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.9, 12);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5, shininess: 30 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.45;
        body.name = "Body";
        group.add(body);

        // Head (skin color sphere)
        const headGeo = new THREE.SphereGeometry(0.2, 16, 12);
        const headMat = new THREE.MeshPhongMaterial({ color: 0xd4a574, shininess: 40 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.1;
        head.name = "Head";
        group.add(head);

        // Hair (dark)
        const hairGeo = new THREE.SphereGeometry(0.21, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairMat = new THREE.MeshPhongMaterial({ color: 0x2a1a0a });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 1.15;
        group.add(hair);

        // Glasses
        const glassGeo = new THREE.TorusGeometry(0.06, 0.01, 8, 16);
        const glassMat = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 80 });
        const glassL = new THREE.Mesh(glassGeo, glassMat);
        glassL.position.set(-0.07, 1.12, 0.17);
        group.add(glassL);
        const glassR = new THREE.Mesh(glassGeo, glassMat);
        glassR.position.set(0.07, 1.12, 0.17);
        group.add(glassR);
        // Bridge
        const bridgeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 4);
        const bridge = new THREE.Mesh(bridgeGeo, glassMat);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, 1.12, 0.19);
        group.add(bridge);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.025, 8, 6);
        const eyeMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.07, 1.12, 0.2);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.07, 1.12, 0.2);
        group.add(eyeR);

        // Smile
        const smileGeo = new THREE.TorusGeometry(0.05, 0.008, 8, 12, Math.PI);
        const smileMat = new THREE.MeshPhongMaterial({ color: 0xcc7755 });
        const smile = new THREE.Mesh(smileGeo, smileMat);
        smile.position.set(0, 1.05, 0.18);
        smile.rotation.x = Math.PI;
        group.add(smile);

        // Left arm (holding pen)
        const armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.5, 8);
        const armMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 });
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.35, 0.65, 0.1);
        leftArm.rotation.z = 0.5;
        leftArm.name = "LeftArm";
        group.add(leftArm);

        // Right arm (gesturing)
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.35, 0.65, 0.1);
        rightArm.rotation.z = -0.5;
        rightArm.name = "RightArm";
        group.add(rightArm);

        // Hands
        const handGeo = new THREE.SphereGeometry(0.06, 8, 6);
        const handMat = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
        const leftHand = new THREE.Mesh(handGeo, handMat);
        leftHand.position.set(-0.48, 0.45, 0.15);
        leftHand.name = "LeftHand";
        group.add(leftHand);
        const rightHand = new THREE.Mesh(handGeo, handMat);
        rightHand.position.set(0.48, 0.45, 0.15);
        rightHand.name = "RightHand";
        group.add(rightHand);

        // Pen in left hand
        const penGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.25, 6);
        const penMat = new THREE.MeshPhongMaterial({ color: 0x1a237e, shininess: 80 });
        const pen = new THREE.Mesh(penGeo, penMat);
        pen.position.set(-0.5, 0.55, 0.18);
        pen.rotation.z = 0.3;
        pen.name = "Pen";
        group.add(pen);

        // Pen tip
        const tipGeo = new THREE.ConeGeometry(0.015, 0.06, 6);
        const tipMat = new THREE.MeshPhongMaterial({ color: 0xb8860b });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(-0.52, 0.68, 0.19);
        tip.rotation.z = 0.3;
        group.add(tip);

        // Stethoscope
        const stethGeo = new THREE.TorusGeometry(0.08, 0.012, 8, 16, Math.PI);
        const stethMat = new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 60 });
        const steth = new THREE.Mesh(stethGeo, stethMat);
        steth.position.set(0, 0.85, 0.22);
        steth.rotation.x = -0.3;
        group.add(steth);

        // ID badge
        const badgeGeo = new THREE.BoxGeometry(0.1, 0.12, 0.01);
        const badgeMat = new THREE.MeshPhongMaterial({ color: 0x2196f3 });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0.15, 0.7, 0.26);
        group.add(badge);

        // Lab coat pockets
        const pocketGeo = new THREE.BoxGeometry(0.12, 0.08, 0.01);
        const pocketMat = new THREE.MeshPhongMaterial({ color: 0xe8e8e8 });
        const pocketL = new THREE.Mesh(pocketGeo, pocketMat);
        pocketL.position.set(-0.15, 0.3, 0.3);
        group.add(pocketL);
        const pocketR = new THREE.Mesh(pocketGeo, pocketMat);
        pocketR.position.set(0.15, 0.3, 0.3);
        group.add(pocketR);

        // Shoes
        const shoeGeo = new THREE.BoxGeometry(0.1, 0.06, 0.15);
        const shoeMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
        const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
        shoeL.position.set(-0.12, 0.03, 0.03);
        group.add(shoeL);
        const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
        shoeR.position.set(0.12, 0.03, 0.03);
        group.add(shoeR);

        // Name tag (floating text placeholder)
        const tagGeo = new THREE.BoxGeometry(0.4, 0.1, 0.01);
        const tagMat = new THREE.MeshPhongMaterial({ color: 0x0d47a1 });
        const tag = new THREE.Mesh(tagGeo, tagMat);
        tag.position.set(0, 1.4, 0);
        group.add(tag);

        return group;
    },

    // ============ MACROPHAGE ============
    createMacrophage() {
        const group = new THREE.Group();
        group.userData = { entityId: "macrophage", clickable: true };

        // Main cell body (organic shape)
        const bodyGeo = new THREE.SphereGeometry(1.2, 32, 24);
        const positions = bodyGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
            const noise = Math.sin(x * 3) * 0.08 + Math.cos(z * 2) * 0.06;
            positions.setX(i, x + noise * x);
            positions.setY(i, y + noise * 0.5);
            positions.setZ(i, z + noise * z);
        }
        bodyGeo.computeVertexNormals();

        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0x66b3ff, transparent: true, opacity: 0.85, shininess: 60, side: THREE.DoubleSide
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = "CellBody";
        group.add(body);

        // Membrane wireframe
        const memGeo = new THREE.SphereGeometry(1.35, 24, 16);
        const memMat = new THREE.MeshBasicMaterial({ color: 0x4da6ff, wireframe: true, transparent: true, opacity: 0.15 });
        group.add(new THREE.Mesh(memGeo, memMat));

        // Nucleus
        const nucGeo = new THREE.SphereGeometry(0.35, 16, 12);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0x4d4dff, shininess: 80 });
        const nucleus = new THREE.Mesh(nucGeo, nucMat);
        nucleus.name = "Nucleus";
        group.add(nucleus);

        // Lysosomes
        for (let i = 0; i < 6; i++) {
            const lysGeo = new THREE.SphereGeometry(0.1, 8, 6);
            const lysMat = new THREE.MeshPhongMaterial({ color: 0xfdd835, shininess: 40 });
            const lys = new THREE.Mesh(lysGeo, lysMat);
            const angle = (i / 6) * Math.PI * 2;
            const r = 0.5 + Math.random() * 0.3;
            lys.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 0.3, Math.sin(angle) * r);
            lys.name = "Lysosome_" + i;
            group.add(lys);
        }

        // Pseudopods
        for (let i = 0; i < 4; i++) {
            const podGeo = new THREE.CylinderGeometry(0.12, 0.25, 0.6, 8);
            const podMat = new THREE.MeshPhongMaterial({ color: 0x66b3ff, transparent: true, opacity: 0.8 });
            const pod = new THREE.Mesh(podGeo, podMat);
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            pod.position.set(Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9);
            pod.rotation.z = -Math.cos(angle) * 0.5;
            pod.rotation.x = Math.sin(angle) * 0.5;
            pod.name = "Pseudopod_" + i;
            pod.userData.isPseudopod = true;
            group.add(pod);
        }

        return group;
    },

    // ============ BACTERIUM (TB) ============
    createBacterium() {
        const group = new THREE.Group();
        group.userData = { entityId: "bacterium", clickable: true };

        const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xd9534f, shininess: 30 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        body.name = "CellBody";
        group.add(body);

        // Cell wall
        const wallGeo = new THREE.CapsuleGeometry(0.35, 0.7, 8, 16);
        const wallMat = new THREE.MeshPhongMaterial({ color: 0xcc3333, transparent: true, opacity: 0.3, wireframe: true });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.rotation.z = Math.PI / 2;
        group.add(wall);

        // Flagella
        const flagGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4);
        const flagMat = new THREE.MeshPhongMaterial({ color: 0xd9534f });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0.6, 0, 0);
        flag.rotation.z = Math.PI / 2;
        group.add(flag);

        return group;
    },

    // ============ HUMAN CELL ============
    createHumanCell() {
        const group = new THREE.Group();
        group.userData = { entityId: "human_cell", clickable: true };

        const bodyGeo = new THREE.SphereGeometry(1.5, 32, 24);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0x99cc99, transparent: true, opacity: 0.7, shininess: 40, side: THREE.DoubleSide });
        group.add(new THREE.Mesh(bodyGeo, bodyMat));

        const nucGeo = new THREE.SphereGeometry(0.5, 16, 12);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0x4d4dff, shininess: 80 });
        const nucleus = new THREE.Mesh(nucGeo, nucMat);
        nucleus.name = "Nucleus";
        group.add(nucleus);

        for (let i = 0; i < 5; i++) {
            const mitGeo = new THREE.CapsuleGeometry(0.12, 0.3, 6, 8);
            const mitMat = new THREE.MeshPhongMaterial({ color: 0xe64a19, shininess: 50 });
            const mit = new THREE.Mesh(mitGeo, mitMat);
            const angle = (i / 5) * Math.PI * 2 + 0.3;
            const r = 0.7 + Math.random() * 0.4;
            mit.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 0.3, Math.sin(angle) * r);
            mit.rotation.set(Math.random(), angle, Math.PI / 4);
            mit.name = "Mitochondria_" + i;
            group.add(mit);
        }

        for (let i = 0; i < 4; i++) {
            const lysGeo = new THREE.SphereGeometry(0.08, 8, 6);
            const lysMat = new THREE.MeshPhongMaterial({ color: 0xfdd835 });
            const lys = new THREE.Mesh(lysGeo, lysMat);
            const angle = (i / 4) * Math.PI * 2 + 1;
            lys.position.set(Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9);
            lys.name = "Lysosome_" + i;
            group.add(lys);
        }

        return group;
    },

    createPhagosome() {
        const group = new THREE.Group();
        group.userData = { entityId: "phagosome", clickable: true };
        const geo = new THREE.SphereGeometry(0.6, 16, 12);
        const mat = new THREE.MeshPhongMaterial({ color: 0x7cb342, transparent: true, opacity: 0.6, shininess: 30 });
        group.add(new THREE.Mesh(geo, mat));
        return group;
    },

    createPhagolysosome() {
        const group = new THREE.Group();
        group.userData = { entityId: "phagolysosome", clickable: true };
        const geo = new THREE.SphereGeometry(0.7, 16, 12);
        const mat = new THREE.MeshPhongMaterial({ color: 0xcc7a00, transparent: true, opacity: 0.7, shininess: 60 });
        group.add(new THREE.Mesh(geo, mat));
        const glowGeo = new THREE.SphereGeometry(0.4, 12, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.4 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.name = "Glow";
        group.add(glow);
        return group;
    },

    // ============ NEUTROPHIL ============
    createNeutrophil() {
        const group = new THREE.Group();
        group.userData = { entityId: "neutrophil", clickable: true };
        const bodyGeo = new THREE.SphereGeometry(1.0, 20, 16);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xe8d4e8, shininess: 40, transparent: true, opacity: 0.85 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = "CellBody";
        group.add(body);
        const nucGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0x6a0dad, shininess: 60 });
        const nuc = new THREE.Mesh(nucGeo, nucMat);
        nuc.rotation.x = Math.PI / 2;
        nuc.name = "Nucleus";
        group.add(nuc);
        for (let i = 0; i < 8; i++) {
            const granGeo = new THREE.SphereGeometry(0.06, 6, 4);
            const granMat = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
            const gran = new THREE.Mesh(granGeo, granMat);
            const a = (i / 8) * Math.PI * 2;
            gran.position.set(Math.cos(a) * 0.6, (Math.random() - 0.5) * 0.4, Math.sin(a) * 0.6);
            gran.name = "Granule_" + i;
            group.add(gran);
        }
        return group;
    },

    // ============ LYMPHOCYTE (T-Cell) ============
    createLymphocyte() {
        const group = new THREE.Group();
        group.userData = { entityId: "lymphocyte", clickable: true };
        const bodyGeo = new THREE.SphereGeometry(0.8, 20, 16);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0x4169e1, shininess: 50, transparent: true, opacity: 0.85 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = "CellBody";
        group.add(body);
        const nucGeo = new THREE.SphereGeometry(0.5, 12, 10);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0x191970, shininess: 80 });
        const nuc = new THREE.Mesh(nucGeo, nucMat);
        nuc.name = "Nucleus";
        group.add(nuc);
        return group;
    },

    // ============ RED BLOOD CELL ============
    createRedBloodCell() {
        const group = new THREE.Group();
        group.userData = { entityId: "red_blood_cell", clickable: true };
        const outerGeo = new THREE.TorusGeometry(0.6, 0.25, 12, 24);
        const outerMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, shininess: 40 });
        const outer = new THREE.Mesh(outerGeo, outerMat);
        outer.rotation.x = Math.PI / 2;
        outer.name = "CellBody";
        group.add(outer);
        const centerGeo = new THREE.SphereGeometry(0.15, 8, 6);
        const centerMat = new THREE.MeshPhongMaterial({ color: 0x990000, shininess: 30 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.scale.y = 0.3;
        group.add(center);
        return group;
    },

    // ============ CANCER CELL ============
    createCancerCell() {
        const group = new THREE.Group();
        group.userData = { entityId: "cancer_cell", clickable: true };
        const bodyGeo = new THREE.IcosahedronGeometry(1.0, 1);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0x8b0000, shininess: 20, transparent: true, opacity: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = "CellBody";
        group.add(body);
        const nucGeo = new THREE.SphereGeometry(0.4, 12, 10);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0x4a0000, shininess: 60 });
        const nuc = new THREE.Mesh(nucGeo, nucMat);
        nuc.position.set(0.2, 0.1, 0);
        nuc.name = "Nucleus";
        group.add(nuc);
        for (let i = 0; i < 6; i++) {
            const bumpGeo = new THREE.SphereGeometry(0.15, 6, 4);
            const bumpMat = new THREE.MeshPhongMaterial({ color: 0xa00000 });
            const bump = new THREE.Mesh(bumpGeo, bumpMat);
            const a = (i / 6) * Math.PI * 2;
            const r = 0.9;
            bump.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 0.5, Math.sin(a) * r);
            bump.name = "Bump_" + i;
            group.add(bump);
        }
        return group;
    },

    // ============ NEURON ============
    createNeuron() {
        const group = new THREE.Group();
        group.userData = { entityId: "neuron", clickable: true };
        const somaGeo = new THREE.SphereGeometry(0.5, 16, 12);
        const somaMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 50 });
        const soma = new THREE.Mesh(somaGeo, somaMat);
        soma.name = "CellBody";
        group.add(soma);
        const nucGeo = new THREE.SphereGeometry(0.2, 10, 8);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0xb8860b, shininess: 80 });
        const nuc = new THREE.Mesh(nucGeo, nucMat);
        nuc.name = "Nucleus";
        group.add(nuc);
        for (let i = 0; i < 5; i++) {
            const dendGeo = new THREE.CylinderGeometry(0.02, 0.06, 0.8, 6);
            const dendMat = new THREE.MeshPhongMaterial({ color: 0xdaa520 });
            const dend = new THREE.Mesh(dendGeo, dendMat);
            const a = (i / 5) * Math.PI * 2;
            dend.position.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7);
            dend.rotation.z = -Math.cos(a) * 0.8;
            dend.rotation.x = Math.sin(a) * 0.8;
            dend.name = "Dendrite_" + i;
            group.add(dend);
        }
        const axonGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6);
        const axonMat = new THREE.MeshPhongMaterial({ color: 0xdaa520 });
        const axon = new THREE.Mesh(axonGeo, axonMat);
        axon.position.set(0, -1.2, 0);
        axon.name = "Axon";
        group.add(axon);
        for (let i = 0; i < 4; i++) {
            const myelinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
            const myelinMat = new THREE.MeshPhongMaterial({ color: 0xf5f5dc });
            const myelin = new THREE.Mesh(myelinGeo, myelinMat);
            myelin.position.set(0, -0.5 - i * 0.4, 0);
            myelin.name = "Myelin_" + i;
            group.add(myelin);
        }
        return group;
    },

    // ============ VIRUS ============
    createVirus() {
        const group = new THREE.Group();
        group.userData = { entityId: "virus", clickable: true };
        const coreGeo = new THREE.IcosahedronGeometry(0.5, 0);
        const coreMat = new THREE.MeshPhongMaterial({ color: 0x228b22, shininess: 40 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.name = "CellBody";
        group.add(core);
        for (let i = 0; i < 12; i++) {
            const spikeGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.3, 4);
            const spikeMat = new THREE.MeshPhongMaterial({ color: 0x006400 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            const phi = Math.acos(1 - 2 * (i + 0.5) / 12);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            spike.position.set(
                Math.sin(phi) * Math.cos(theta) * 0.65,
                Math.cos(phi) * 0.65,
                Math.sin(phi) * Math.sin(theta) * 0.65
            );
            spike.lookAt(0, 0, 0);
            spike.name = "Spike_" + i;
            group.add(spike);
        }
        return group;
    },

    // ============ BRAIN ============
    createBrain() {
        const group = new THREE.Group();
        group.userData = { entityId: "brain", clickable: true };
        const leftGeo = new THREE.SphereGeometry(1.2, 20, 16, 0, Math.PI);
        const leftMat = new THREE.MeshPhongMaterial({ color: 0xffb6c1, shininess: 30 });
        const left = new THREE.Mesh(leftGeo, leftMat);
        left.position.x = -0.3;
        left.name = "CellBody";
        group.add(left);
        const rightGeo = new THREE.SphereGeometry(1.2, 20, 16, 0, Math.PI);
        const rightMat = new THREE.MeshPhongMaterial({ color: 0xffb6c1, shininess: 30 });
        const right = new THREE.Mesh(rightGeo, rightMat);
        right.rotation.y = Math.PI;
        right.position.x = 0.3;
        group.add(right);
        for (let i = 0; i < 8; i++) {
            const foldGeo = new THREE.TorusGeometry(0.3, 0.05, 6, 12);
            const foldMat = new THREE.MeshPhongMaterial({ color: 0xff9999 });
            const fold = new THREE.Mesh(foldGeo, foldMat);
            const a = (i / 8) * Math.PI * 2;
            fold.position.set(Math.cos(a) * 0.8, Math.sin(a) * 0.5, (Math.random() - 0.5) * 0.3);
            fold.rotation.set(Math.random(), a, Math.random());
            fold.name = "Fold_" + i;
            group.add(fold);
        }
        const brainstemGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.8, 8);
        const brainstemMat = new THREE.MeshPhongMaterial({ color: 0xe8b4b8 });
        const brainstem = new THREE.Mesh(brainstemGeo, brainstemMat);
        brainstem.position.y = -1.1;
        brainstem.name = "Brainstem";
        group.add(brainstem);
        return group;
    },

    // ============ HEART ============
    createHeart() {
        const group = new THREE.Group();
        group.userData = { entityId: "heart", clickable: true };
        const bodyGeo = new THREE.SphereGeometry(1.0, 16, 12);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, shininess: 50 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1, 1.2, 0.8);
        body.name = "CellBody";
        group.add(body);
        const laGeo = new THREE.SphereGeometry(0.4, 10, 8);
        const laMat = new THREE.MeshPhongMaterial({ color: 0x990000 });
        const la = new THREE.Mesh(laGeo, laMat);
        la.position.set(-0.4, 0.6, 0);
        la.name = "LeftAtrium";
        group.add(la);
        const raGeo = new THREE.SphereGeometry(0.35, 10, 8);
        const raMat = new THREE.MeshPhongMaterial({ color: 0x990000 });
        const ra = new THREE.Mesh(raGeo, raMat);
        ra.position.set(0.4, 0.6, 0);
        ra.name = "RightAtrium";
        group.add(ra);
        const aoGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8);
        const aoMat = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
        const ao = new THREE.Mesh(aoGeo, aoMat);
        ao.position.set(0, 1.0, 0);
        ao.name = "Aorta";
        group.add(ao);
        return group;
    },

    // ============ BLOOD VESSEL ============
    createBloodVessel() {
        const group = new THREE.Group();
        group.userData = { entityId: "blood_vessel", clickable: true };
        const wallGeo = new THREE.CylinderGeometry(0.6, 0.6, 3.0, 16, 1, true);
        const wallMat = new THREE.MeshPhongMaterial({ color: 0xcc3333, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.rotation.z = Math.PI / 2;
        wall.name = "CellBody";
        group.add(wall);
        const innerGeo = new THREE.CylinderGeometry(0.45, 0.45, 3.0, 16, 1, true);
        const innerMat = new THREE.MeshPhongMaterial({ color: 0xffcccc, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.rotation.z = Math.PI / 2;
        inner.name = "Endothelium";
        group.add(inner);
        return group;
    },

    // ============ DNA DOUBLE HELIX ============
    createDNA() {
        const group = new THREE.Group();
        group.userData = { entityId: "dna", clickable: true };
        for (let i = 0; i < 20; i++) {
            const t = (i / 20) * Math.PI * 4;
            const y = (i / 20) * 4 - 2;
            const strand1Geo = new THREE.SphereGeometry(0.08, 6, 4);
            const strand1Mat = new THREE.MeshPhongMaterial({ color: 0x0000ff });
            const strand1 = new THREE.Mesh(strand1Geo, strand1Mat);
            strand1.position.set(Math.cos(t) * 0.3, y, Math.sin(t) * 0.3);
            group.add(strand1);
            const strand2Geo = new THREE.SphereGeometry(0.08, 6, 4);
            const strand2Mat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const strand2 = new THREE.Mesh(strand2Geo, strand2Mat);
            strand2.position.set(Math.cos(t + Math.PI) * 0.3, y, Math.sin(t + Math.PI) * 0.3);
            group.add(strand2);
            if (i % 2 === 0) {
                const baseGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
                const baseMat = new THREE.MeshPhongMaterial({ color: 0x00cc00 });
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.set(0, y, 0);
                base.rotation.z = Math.PI / 2;
                base.lookAt(strand1.position);
                group.add(base);
            }
        }
        group.name = "CellBody";
        return group;
    },

    // ============ ANTIBODY (IgG) ============
    createAntibody() {
        const group = new THREE.Group();
        group.userData = { entityId: "antibody", clickable: true };
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
        const stemMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 60 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.name = "CellBody";
        group.add(stem);
        const fab1Geo = new THREE.SphereGeometry(0.15, 10, 8);
        const fab1Mat = new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 60 });
        const fab1 = new THREE.Mesh(fab1Geo, fab1Mat);
        fab1.position.set(-0.2, 0.4, 0);
        fab1.name = "Fab";
        group.add(fab1);
        const fab2Geo = new THREE.SphereGeometry(0.15, 10, 8);
        const fab2Mat = new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 60 });
        const fab2 = new THREE.Mesh(fab2Geo, fab2Mat);
        fab2.position.set(0.2, 0.4, 0);
        group.add(fab2);
        const fcGeo = new THREE.SphereGeometry(0.12, 10, 8);
        const fcMat = new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 60 });
        const fc = new THREE.Mesh(fcGeo, fcMat);
        fc.position.set(0, -0.4, 0);
        fc.name = "Fc";
        group.add(fc);
        return group;
    },

    // ============ RECEPTOR PROTEIN ============
    createReceptor() {
        const group = new THREE.Group();
        group.userData = { entityId: "receptor", clickable: true };
        const memGeo = new THREE.BoxGeometry(1.5, 0.1, 0.5);
        const memMat = new THREE.MeshPhongMaterial({ color: 0xffcc00, transparent: true, opacity: 0.4 });
        const mem = new THREE.Mesh(memGeo, memMat);
        mem.name = "CellBody";
        group.add(mem);
        const extraGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8);
        const extraMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
        const extra = new THREE.Mesh(extraGeo, extraMat);
        extra.position.y = 0.25;
        extra.name = "Extracellular";
        group.add(extra);
        const intraGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.3, 6);
        const intraMat = new THREE.MeshPhongMaterial({ color: 0xcc3300 });
        const intra = new THREE.Mesh(intraGeo, intraMat);
        intra.position.y = -0.2;
        intra.name = "Intracellular";
        group.add(intra);
        return group;
    },

    // ============ STEM CELL ============
    createStemCell() {
        const group = new THREE.Group();
        group.userData = { entityId: "stem_cell", clickable: true };
        const bodyGeo = new THREE.SphereGeometry(0.9, 20, 16);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0x98fb98, shininess: 50, transparent: true, opacity: 0.85 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = "CellBody";
        group.add(body);
        const nucGeo = new THREE.SphereGeometry(0.35, 12, 10);
        const nucMat = new THREE.MeshPhongMaterial({ color: 0x228b22, shininess: 80 });
        const nuc = new THREE.Mesh(nucGeo, nucMat);
        nuc.name = "Nucleus";
        group.add(nuc);
        const glowGeo = new THREE.SphereGeometry(1.0, 16, 12);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.name = "Glow";
        group.add(glow);
        return group;
    },

    createAsset(entityId) {
        switch (entityId) {
            case "dr_doom": return this.createDrDoom();
            case "macrophage": return this.createMacrophage();
            case "bacterium": return this.createBacterium();
            case "human_cell": return this.createHumanCell();
            case "phagosome": return this.createPhagosome();
            case "phagolysosome": return this.createPhagolysosome();
            case "neutrophil": return this.createNeutrophil();
            case "lymphocyte": return this.createLymphocyte();
            case "red_blood_cell": return this.createRedBloodCell();
            case "cancer_cell": return this.createCancerCell();
            case "neuron": return this.createNeuron();
            case "virus": return this.createVirus();
            case "brain": return this.createBrain();
            case "heart": return this.createHeart();
            case "blood_vessel": return this.createBloodVessel();
            case "dna": return this.createDNA();
            case "antibody": return this.createAntibody();
            case "receptor": return this.createReceptor();
            case "stem_cell": return this.createStemCell();
            default: return new THREE.Group();
        }
    }
};
