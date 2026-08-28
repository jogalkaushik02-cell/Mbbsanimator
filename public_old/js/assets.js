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

    createAsset(entityId) {
        switch (entityId) {
            case "dr_doom": return this.createDrDoom();
            case "macrophage": return this.createMacrophage();
            case "bacterium": return this.createBacterium();
            case "human_cell": return this.createHumanCell();
            case "phagosome": return this.createPhagosome();
            case "phagolysosome": return this.createPhagolysosome();
            default: return new THREE.Group();
        }
    }
};
