// ============================================
// Synthesizer - Storyboard-first animation system
// Each topic gets unique biological storyboard
// NOT copies of phagocytosis for everything
// ============================================

class Synthesizer {

    static synthesize(topic, researchData) {
        const facts = Synthesizer.extractFacts(researchData, topic);
        const wikiSummary = researchData.wikipedia?.summary || "";
        const allText = Synthesizer.getAllText(researchData, topic);

        const storyboard = Synthesizer.getStoryboard(topic, wikiSummary, allText, facts, researchData);
        const narration = storyboard.scenes.map((scene, i) => ({
            time: storyboard.scenes.slice(0, i).reduce((sum, s) => sum + s.duration, 0),
            text: scene.narration
        }));
        const totalTime = narration.length > 0 ? narration[narration.length - 1].time + storyboard.scenes[storyboard.scenes.length - 1].duration : 10;
        narration.push({ time: totalTime, text: "This concludes our lesson on " + topic + "." });

        const quiz = Synthesizer.buildQuiz(topic, storyboard, researchData);

        return {
            topic,
            synthesizedAt: new Date().toISOString(),
            factsFound: facts.length,
            facts,
            processSteps: storyboard.scenes.map((s, i) => ({ step: i + 1, name: s.label, description: s.narration, type: s.type })),
            narration,
            quiz,
            animationSteps: storyboard.scenes,
            sources: Synthesizer.summarizeSources(researchData),
            storyboard
        };
    }

    // ======= STORYBOARD ROUTER =======
    static getStoryboard(topic, wikiSummary, allText, facts, researchData) {
        const lower = topic.toLowerCase().trim();

        // Pre-built storyboards for specific topics
        if (lower.includes("phagocytosis")) return Synthesizer.phagocytosisStoryboard();
        if (lower.includes("acute inflammation") || lower.match(/\binflammation\b/) && lower.includes("acute")) return Synthesizer.inflammationStoryboard(topic);
        if (lower.includes("tuberculosis") || lower.match(/\btb\b/)) return Synthesizer.tbStoryboard(topic);
        if (lower.includes("apoptosis")) return Synthesizer.apoptosisStoryboard(topic);
        if (lower.includes("neuron") || lower.includes("nerve impulse") || lower.includes("action potential")) return Synthesizer.actionPotentialStoryboard(topic);
        if (lower.includes("malaria")) return Synthesizer.malariaStoryboard(topic);
        if (lower.includes("cancer") || lower.includes("carcinoma") || lower.includes("tumor")) return Synthesizer.cancerStoryboard(topic);

        // Dynamic generator for ALL other topics
        return Synthesizer.generateStoryboard(topic, wikiSummary, allText, facts, researchData);
    }

    // ======= PHAGOCYTOSIS (FIXED: labels, narration, camera) =======
    static phagocytosisStoryboard() {
        return {
            topic: "Phagocytosis",
            stages: 7,
            scenes: [
                {
                    step: 1, name: "Identify Cells", label: "Phagocytosis",
                    type: "intro",
                    narration: "This is a tissue macrophage, a large phagocytic cell derived from monocytes. Nearby is a pathogenic bacterium. The macrophage will now detect and eliminate this threat through a precise five-stage mechanism.",
                    duration: 5,
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 8, y: 0, z: 0 } },
                    camera: { distance: 22, angle: 0.3, target: [4, 0, 0] },
                    labels: [
                        { text: "Macrophage", entity: "macrophage", offset: [-2, 2.5, 0] },
                        { text: "Bacterium", entity: "bacterium", offset: [0, 1.8, 0] },
                        { text: "Cell membrane", position: [1.2, 0.5, 0], offset: [0, 0.8, 0] }
                    ],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Opsonization & Recognition", label: "1. Opsonization & Recognition",
                    type: "recognition",
                    narration: "Before direct contact, complement protein C3b and antibody IgG coat the bacterial surface — this is opsonization. The macrophage uses specific receptors: TLR4 binds bacterial LPS, Scavenger receptors bind cell wall components, and Fc receptors bind the IgG opsonins. This receptor-mediated recognition ensures the macrophage does not attack host cells.",
                    duration: 7,
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 2.5, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 0.5, target: [1.2, 0, 0] },
                    labels: [
                        { text: "Macrophage", entity: "macrophage", offset: [-2, 2, 0] },
                        { text: "Bacterium", entity: "bacterium", offset: [0, 1.8, 0] },
                        { text: "TLR4", position: [0.8, 0.4, 0], offset: [0, 0.7, 0] },
                        { text: "Fc receptor", position: [0.6, -0.2, 0], offset: [-1, 0, 0] },
                        { text: "IgG opsonin", position: [1.8, 0.4, 0], offset: [0, 0.7, 0] },
                        { text: "C3b", position: [2.0, 0, 0], offset: [0.8, 0, 0] }
                    ],
                    effect: "bacterium_swim",
                    animation: "recognition"
                },
                {
                    step: 3, name: "Engulfment", label: "2. Engulfment",
                    type: "engulfment",
                    narration: "The macrophage membrane extends pseudopod projections around the bacterium. Actin polymerization drives the membrane outward. The pseudopods surround the pathogen and the membrane fuses at the distal end, enclosing the bacterium in a vesicle. This process originates from the plasma membrane, not from within the cell.",
                    duration: 7,
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 0.5, y: 0, z: 0 } },
                    camera: { distance: 8, angle: 0.8, target: [0.3, 0, 0] },
                    labels: [
                        { text: "Pseudopod", position: [0.8, 0.6, 0], offset: [0, 0.8, 0] },
                        { text: "Actin polymerization", position: [0.4, 0.9, 0], offset: [1, 0, 0] },
                        { text: "Engulfing membrane", position: [0, 1.3, 0], offset: [0, 0.5, 0] }
                    ],
                    effect: "extend_pseudopods",
                    animation: "engulf"
                },
                {
                    step: 4, name: "Phagosome Formation", label: "3. Phagosome Formation",
                    type: "formation",
                    narration: "The membrane completely surrounds the bacterium and pinches off from the plasma membrane through dynamin-mediated scission. The bacterium is now enclosed inside a phagosome, an intracellular vesicle within the cytoplasm. The phagosome is acidic and contains some antimicrobial peptides.",
                    duration: 5,
                    entities: ["macrophage", "bacterium", "phagosome"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 0, y: 0, z: 0 }, phagosome: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 8, angle: 1.0, target: [0, 0, 0] },
                    labels: [
                        { text: "Phagosome", entity: "phagosome", offset: [0, 1.5, 0] },
                        { text: "Cytoplasm", position: [-2, 1.5, 0], offset: [0, 0, 0] },
                        { text: "Dynamin", position: [0.3, 0.8, 0], offset: [0.8, 0, 0] }
                    ],
                    effect: "form_phagosome",
                    animation: "phagosome_formation"
                },
                {
                    step: 5, name: "Lysosome Fusion", label: "4. Phagolysosome Formation",
                    type: "fusion",
                    narration: "Late endosomes and lysosomes containing digestive enzymes — cathepsins, lysozyme, and proteases — are recruited to the phagosome through Rab7-mediated trafficking. A lysosome fuses with the phagosome, creating a phagolysosome. The compartment acidifies to pH 4.5 through V-ATPase proton pumps.",
                    duration: 6,
                    entities: ["macrophage", "phagolysosome"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, phagolysosome: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 7, angle: 1.5, target: [0, 0, 0] },
                    labels: [
                        { text: "Lysosome", position: [1.2, 0.8, 0], offset: [0, 0.8, 0] },
                        { text: "Phagolysosome", entity: "phagolysosome", offset: [0, 1.5, 0] },
                        { text: "Cathepsins", position: [0.8, 0, 0], offset: [0.8, 0, 0] },
                        { text: "pH 4.5", position: [-0.5, 0.5, 0], offset: [-0.8, 0, 0] }
                    ],
                    effect: "fuse_lysosomes",
                    animation: "lysosome_fusion"
                },
                {
                    step: 6, name: "Killing & Digestion", label: "5. Killing & Digestion",
                    type: "destruction",
                    narration: "Inside the phagolysosome, three killing mechanisms operate: lysosomal enzymes degrade proteins, reactive oxygen species from NADPH oxidase (respiratory burst) damage DNA and lipids, and nitric oxide from iNOS kills intracellular bacteria. The bacterial structure progressively fragments into smaller pieces.",
                    duration: 7,
                    entities: ["macrophage", "phagolysosome"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, phagolysosome: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 6, angle: 2.0, target: [0, 0, 0] },
                    labels: [
                        { text: "NADPH oxidase", position: [0.5, 0.8, 0], offset: [0, 0.6, 0] },
                        { text: "ROS (O₂⁻)", position: [-0.5, 0.3, 0], offset: [-1, 0, 0] },
                        { text: "Lysosomal enzymes", position: [0, -0.3, 0], offset: [0.8, 0, 0] },
                        { text: "Bacterial fragments", position: [0, 0, 0], offset: [0, 1, 0] }
                    ],
                    effect: "destroy",
                    animation: "digestion"
                },
                {
                    step: 7, name: "Antigen Presentation", label: "Phagocytosis Complete",
                    type: "summary",
                    narration: "After digestion, bacterial peptide fragments are loaded onto MHC class II molecules and presented on the macrophage surface. This activates CD4+ T helper cells, linking innate phagocytosis to adaptive immunity. The complete pathway: Opsonization → Receptor Recognition → Pseudopod Engulfment → Phagosome Formation → Lysosome Fusion → Enzymatic Killing → Antigen Presentation.",
                    duration: 6,
                    entities: ["macrophage"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 18, angle: 3.0, target: [0, 0, 0] },
                    labels: [
                        { text: "MHC-II + peptide", position: [1.2, 0.8, 0], offset: [0, 0.8, 0] },
                        { text: "CD4+ T cell activation", position: [2, 1.5, 0], offset: [0, 0, 0] },
                        { text: "Opsonization → Recognition → Engulfment → Phagosome → Phagolysosome → Killing → Presentation", position: [0, 3, 0], offset: [0, 0, 0] }
                    ],
                    effect: "doctor_explain",
                    animation: "summary"
                }
            ]
        };
    }

    // ======= APOPTOSIS =======
    static apoptosisStoryboard(topic) {
        return {
            topic, stages: 7,
            scenes: [
                {
                    step: 1, name: "Apoptosis Signal", label: "Apoptosis",
                    type: "intro",
                    narration: "Apoptosis is programmed cell death — a controlled, energy-dependent process that eliminates damaged or unwanted cells without inflammation. Unlike necrosis, the cell dismantles itself from within.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 18, angle: 0.3, target: [0, 0, 0] },
                    labels: [{ text: "Apoptosis", position: [0, 3, 0], offset: [0, 0, 0] }, { text: "Cell", entity: "human_cell", offset: [0, 2, 0] }],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Death Receptor Activation", label: "1. Intrinsic/Extrinsic Pathway",
                    type: "trigger",
                    narration: "Extrinsic pathway: TNF or Fas ligand binds death receptors (Fas, TNFR1), recruiting FADD and activating Caspase-8. Intrinsic pathway: DNA damage releases cytochrome c from mitochondria, activating Apaf-1 and Caspase-9.",
                    duration: 6, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 0.6, target: [0, 0, 0] },
                    labels: [{ text: "Death receptor", position: [1.2, 0.5, 0], offset: [0, 0.7, 0] }, { text: "Caspase-8", position: [0, 0, 0], offset: [1, 0, 0] }, { text: "Cytochrome c", position: [-0.5, 0, 0], offset: [-1, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 3, name: "Caspase Cascade", label: "2. Caspase Cascade",
                    type: "signaling",
                    narration: "Initiator caspases (8 or 9) activate executioner caspases (3, 6, 7). These proteases cleave hundreds of cellular substrates — structural proteins, DNA repair enzymes, and regulatory molecules — systematically dismantling the cell.",
                    duration: 6, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 1.0, target: [0, 0, 0] },
                    labels: [{ text: "Caspase-3", position: [0, 0.5, 0], offset: [0, 0.7, 0] }, { text: "Substrate cleavage", position: [-0.5, 0, 0], offset: [-1, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 4, name: "Cell Shrinkage", label: "3. Cell Shrinkage",
                    type: "action",
                    narration: "The cell shrinks as cytoskeletal proteins are cleaved. The cytoplasm becomes denser. organelles remain intact but the cell detaches from neighbors. Membrane blebs form as the cortex collapses.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 1.5, target: [0, 0, 0] },
                    labels: [{ text: "Blebs", position: [1, 0.3, 0], offset: [0, 0.5, 0] }, { text: "Shrunken cell", position: [0, 2, 0], offset: [0, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 5, name: "DNA Fragmentation", label: "4. DNA Fragmentation",
                    type: "action",
                    narration: "Endonucleases (CAD/DFF40) cleave DNA at internucleosomal linker regions, producing 180bp fragments. This creates the characteristic DNA ladder on gel electrophoresis. The nucleus fragments into apoptotic bodies.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 2.0, target: [0, 0, 0] },
                    labels: [{ text: "CAD endonuclease", position: [0, 0.5, 0], offset: [0, 0.7, 0] }, { text: "DNA ladder", position: [-0.8, 0, 0], offset: [-1, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 6, name: "Phagocytic Uptake", label: "5. Phagocytic Clearance",
                    type: "resolution",
                    narration: "The cell breaks into membrane-bound apoptotic bodies displaying phosphatidylserine (PS) on their outer leaflet — an 'eat me' signal. Macrophages recognize PS through TIM-4 and BAI1 receptors, engulfing the fragments without triggering inflammation.",
                    duration: 6, entities: ["human_cell", "macrophage"], positions: { human_cell: { x: 0, y: 0, z: 0 }, macrophage: { x: 3, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 2.5, target: [1.5, 0, 0] },
                    labels: [{ text: "Apoptotic body", entity: "human_cell", offset: [0, 1.5, 0] }, { text: "PS 'eat me' signal", position: [1, 0.3, 0], offset: [0, 0.5, 0] }, { text: "Macrophage", entity: "macrophage", offset: [0, 2, 0] }],
                    effect: "extend_pseudopods"
                },
                {
                    step: 7, name: "Complete", label: "Apoptosis Complete",
                    type: "summary",
                    narration: "Apoptosis: Death signal → Caspase activation → Cytoskeletal collapse → DNA fragmentation → Apoptotic body formation → Phagocytic clearance. This process is essential for development, immune function, and preventing cancer.",
                    duration: 4, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [{ text: "Signal → Caspases → Shrinkage → Fragmentation → Bodies → Clearance", position: [0, 3, 0], offset: [0, 0, 0] }],
                    effect: "doctor_explain"
                }
            ]
        };
    }

    // ======= ACTION POTENTIAL =======
    static actionPotentialStoryboard(topic) {
        return {
            topic, stages: 7,
            scenes: [
                {
                    step: 1, name: "Resting Neuron", label: "Action Potential",
                    type: "intro",
                    narration: "A neuron at rest maintains a membrane potential of -70mV through the sodium-potassium pump (3Na⁺ out, 2K⁺ in) and leak potassium channels. The interior is negative relative to the exterior.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 18, angle: 0.3, target: [0, 0, 0] },
                    labels: [{ text: "Resting potential: -70mV", position: [0, 3, 0], offset: [0, 0, 0] }, { text: "Neuron", entity: "human_cell", offset: [0, 2, 0] }],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Stimulus", label: "1. Threshold Stimulus",
                    type: "trigger",
                    narration: "A stimulus ( neurotransmitter, sensory input, or electrical signal) depolarizes the membrane. If the membrane reaches threshold (-55mV), voltage-gated sodium channels open. This is the all-or-nothing principle.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 0.6, target: [0, 0, 0] },
                    labels: [{ text: "Threshold: -55mV", position: [0, 2, 0], offset: [0, 0, 0] }, { text: "Na⁺ channels open", position: [1, 0.5, 0], offset: [0, 0.7, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 3, name: "Depolarization", label: "2. Depolarization",
                    type: "action",
                    narration: "Voltage-gated Na⁺ channels open rapidly. Na⁺ rushes into the cell down its electrochemical gradient. The membrane potential shoots from -55mV toward +30mV. This is the rising phase of the action potential.",
                    duration: 4, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 1.0, target: [0, 0, 0] },
                    labels: [{ text: "Na⁺ influx", position: [1, 0, 0], offset: [0.8, 0, 0] }, { text: "+30mV peak", position: [0, 2.5, 0], offset: [0, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 4, name: "Repolarization", label: "3. Repolarization",
                    type: "action",
                    narration: "Na⁺ channels inactivate. Voltage-gated K⁺ channels open with a delay. K⁺ rushes out of the cell, bringing the membrane potential back toward -70mV. This is the falling phase.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 1.5, target: [0, 0, 0] },
                    labels: [{ text: "K⁺ efflux", position: [1, 0, 0], offset: [0.8, 0, 0] }, { text: "Na⁺ channels inactivated", position: [-1, 0.5, 0], offset: [-1, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 5, name: "Hyperpolarization", label: "4. Hyperpolarization",
                    type: "action",
                    narration: "K⁺ channels remain open slightly longer than needed, causing the membrane to hyperpolarize to about -80mV. The Na⁺/K⁺ pump then restores ion concentrations. The refractory period prevents backward propagation.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 2.0, target: [0, 0, 0] },
                    labels: [{ text: "-80mV undershoot", position: [0, 2, 0], offset: [0, 0, 0] }, { text: "Na⁺/K⁺ pump", position: [1, 0, 0], offset: [0.8, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 6, name: "Propagation", label: "5. Propagation",
                    type: "progression",
                    narration: "The depolarization wave propagates along the axon. In myelinated neurons, saltatory conduction jumps between Nodes of Ranvier — much faster than continuous conduction. The signal travels from axon hillock to axon terminal.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 2.5, target: [0, 0, 0] },
                    labels: [{ text: "Nodes of Ranvier", position: [2, 0, 0], offset: [0, 0.5, 0] }, { text: "Saltatory conduction", position: [0, 2, 0], offset: [0, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 7, name: "Complete", label: "Action Potential Complete",
                    type: "summary",
                    narration: "Action potential: Resting (-70mV) → Threshold (-55mV) → Depolarization (Na⁺ influx, +30mV) → Repolarization (K⁺ efflux) → Hyperpolarization (-80mV) → Resting restored. This propagates signals at up to 120m/s.",
                    duration: 4, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [{ text: "-70mV → -55mV → +30mV → -70mV → -80mV → -70mV", position: [0, 3, 0], offset: [0, 0, 0] }],
                    effect: "doctor_explain"
                }
            ]
        };
    }

    // ======= MALARIA =======
    static malariaStoryboard(topic) {
        return {
            topic, stages: 7,
            scenes: [
                {
                    step: 1, name: "Mosquito Bite", label: "Malaria Pathogenesis",
                    type: "intro",
                    narration: "An Anopheles mosquito bites a human and injects Plasmodium sporozoites from its salivary glands. These sporozoites travel through the bloodstream to the liver within 30-60 minutes.",
                    duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 2, z: 0 } },
                    camera: { distance: 22, angle: 0.3, target: [3, 1, 0] },
                    labels: [{ text: "Sporozoites", entity: "bacterium", offset: [0, 1.5, 0] }, { text: "Skin entry", position: [3, 1, 0], offset: [0, 0.8, 0] }],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Liver Stage", label: "1. Hepatocyte Infection",
                    type: "recognition",
                    narration: "Sporozoites invade hepatocytes using CD81 receptors. Inside hepatocytes, each sporozoite develops into a schizont containing 10,000-30,000 merozoites. This liver stage is asymptomatic and lasts 7-10 days.",
                    duration: 6, entities: ["human_cell", "bacterium"], positions: { human_cell: { x: 0, y: 0, z: 0 }, bacterium: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 0.6, target: [0, 0, 0] },
                    labels: [{ text: "Hepatocyte", entity: "human_cell", offset: [-1.5, 2, 0] }, { text: "Schizont", entity: "bacterium", offset: [0, 1.5, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 3, name: "RBC Invasion", label: "2. Red Blood Cell Invasion",
                    type: "engulfment",
                    narration: "Merozoites released from hepatocytes invade red blood cells. They bind to erythrocyte surface proteins (Duffy antigen, Band 3) and enter through a tight junction. Inside the RBC, they develop through ring → trophozoite → schizont stages.",
                    duration: 7, entities: ["bacterium"], positions: { bacterium: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 1.0, target: [0, 0, 0] },
                    labels: [{ text: "Merozoite", entity: "bacterium", offset: [0, 1.5, 0] }, { text: "RBC", position: [0, 0, 0], offset: [0, 2.5, 0] }, { text: "Duffy antigen", position: [1, 0, 0], offset: [0.8, 0, 0] }],
                    effect: "extend_pseudopods"
                },
                {
                    step: 4, name: "RBC Bursting", label: "3. RBC Lysis",
                    type: "destruction",
                    narration: "After 48-72 hours (P. falciparum: 24-36h), the schizont ruptures the RBC, releasing 16-32 new merozoites plus hemozoin pigment. This synchronous rupture causes the characteristic periodic fevers of malaria.",
                    duration: 5, entities: ["bacterium"], positions: { bacterium: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 1.5, target: [0, 0, 0] },
                    labels: [{ text: "Rupture", position: [0, 1, 0], offset: [0, 0.8, 0] }, { text: "Hemozoin", position: [0.5, 0, 0], offset: [0.8, 0, 0] }],
                    effect: "destroy"
                },
                {
                    step: 5, name: "Cytoadherence", label: "4. Sequestration",
                    type: "progression",
                    narration: "P. falciparum-infected RBCs express PfEMP1 on their surface, binding to endothelial receptors (ICAM-1, CSA). This cytoadherence sequesters infected RBCs in deep vasculature, avoiding splenic clearance. Causes cerebral malaria and placental malaria.",
                    duration: 6, entities: ["bacterium"], positions: { bacterium: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 2.0, target: [0, 0, 0] },
                    labels: [{ text: "PfEMP1", position: [1, 0.3, 0], offset: [0, 0.5, 0] }, { text: "ICAM-1", position: [1.5, 0.8, 0], offset: [0, 0.5, 0] }, { text: "Cytoadherence", position: [0, 2, 0], offset: [0, 0, 0] }],
                    effect: "doctor_point_bacterium"
                },
                {
                    step: 6, name: "Gametocytes", label: "5. Sexual Stage",
                    type: "formation",
                    narration: "Some merozoites differentiate into male and female gametocytes instead of schizonts. These circulate in peripheral blood and are taken up by mosquitoes during feeding, completing the lifecycle.",
                    duration: 5, entities: ["bacterium"], positions: { bacterium: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 2.5, target: [0, 0, 0] },
                    labels: [{ text: "Gametocyte", entity: "bacterium", offset: [0, 1.5, 0] }, { text: "Mosquito uptake", position: [0, 2.5, 0], offset: [0, 0, 0] }],
                    effect: "doctor_write"
                },
                {
                    step: 7, name: "Complete", label: "Malaria Lifecycle Complete",
                    type: "summary",
                    narration: "Malaria: Mosquito → Sporozoites → Liver → Merozoites → RBC invasion → Schizont rupture → Fever cycles → Gametocytes → Mosquito uptake. P. falciparum causes the most severe disease through cytoadherence and cerebral involvement.",
                    duration: 4, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [{ text: "Mosquito → Liver → Blood → Gametocytes → Mosquito", position: [0, 3, 0], offset: [0, 0, 0] }],
                    effect: "doctor_explain"
                }
            ]
        };
    }

    // ======= CANCER =======
    static cancerStoryboard(topic) {
        return {
            topic, stages: 7,
            scenes: [
                {
                    step: 1, name: "Normal Cell", label: "Cancer Development",
                    type: "intro",
                    narration: "Cancer begins when a normal cell accumulates mutations that disable growth control. The cell cycle normally has checkpoints — G1/S, G2/M, and spindle checkpoint — regulated by tumor suppressors (p53, Rb) and proto-oncogenes.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 18, angle: 0.3, target: [0, 0, 0] },
                    labels: [{ text: "Normal cell", entity: "human_cell", offset: [0, 2, 0] }, { text: "Checkpoints", position: [1, 1, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Initiation", label: "1. Mutation Accumulation",
                    type: "trigger",
                    narration: "A proto-oncogene mutates into an oncogene (gain of function) — e.g., RAS mutation keeps it permanently active. A tumor suppressor loses function — e.g., p53 mutation prevents DNA repair. Multiple hits are needed (Knudson's two-hit hypothesis).",
                    duration: 6, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 0.6, target: [0, 0, 0] },
                    labels: [{ text: "RAS mutation", position: [1, 0.5, 0], offset: [0, 0.7, 0] }, { text: "p53 loss", position: [-1, 0.5, 0], offset: [0, 0.7, 0] }, { text: "Oncogene", position: [1, 1.5, 0], offset: [0, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 3, name: "Promotion", label: "2. Clonal Expansion",
                    type: "progression",
                    narration: "The mutated cell divides uncontrollably. Growth factors, survival signals, and angiogenesis factors are upregulated. Telomerase is activated, preventing replicative senescence. The cell ignores anti-growth signals.",
                    duration: 6, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 1.0, target: [0, 0, 0] },
                    labels: [{ text: "Uncontrolled division", position: [0, 2, 0], offset: [0, 0, 0] }, { text: "Telomerase active", position: [1, 0, 0], offset: [0.8, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 4, name: "Angiogenesis", label: "3. Angiogenesis",
                    type: "action",
                    narration: "The growing tumor secretes VEGF, recruiting new blood vessels. Without angiogenesis, tumors cannot grow beyond 1-2mm. The new vessels are leaky and disorganized, contributing to metastasis.",
                    duration: 5, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 1.5, target: [0, 0, 0] },
                    labels: [{ text: "VEGF", position: [1, 1, 0], offset: [0, 0.5, 0] }, { text: "New blood vessels", position: [2, 0, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_point_bacterium"
                },
                {
                    step: 5, name: "Invasion", label: "4. Invasion",
                    type: "progression",
                    narration: "Cancer cells degrade the basement membrane using MMPs (matrix metalloproteinases). They undergo EMT (epithelial-mesenchymal transition), gaining motility. Cells invade surrounding tissue and enter blood/lymphatic vessels (intravasation).",
                    duration: 6, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 2.0, target: [0, 0, 0] },
                    labels: [{ text: "MMPs", position: [1, 0, 0], offset: [0.8, 0, 0] }, { text: "EMT", position: [0, 1.5, 0], offset: [0, 0, 0] }, { text: "Intravasation", position: [2, 0, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_point_bacterium"
                },
                {
                    step: 6, name: "Metastasis", label: "5. Metastasis",
                    type: "progression",
                    narration: "Cancer cells travel through the bloodstream, survive immune surveillance, and extravasate at distant organs. They form micrometastases, then macrometastases. Most cancer deaths are from metastatic disease, not the primary tumor.",
                    duration: 6, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 18, angle: 2.5, target: [0, 0, 0] },
                    labels: [{ text: "Circulating tumor cell", entity: "human_cell", offset: [0, 1.5, 0] }, { text: "Micrometastasis", position: [3, 0, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_point_bacterium"
                },
                {
                    step: 7, name: "Complete", label: "Cancer Progression Complete",
                    type: "summary",
                    narration: "Cancer: Mutation → Clonal expansion → Angiogenesis → Invasion → Metastasis. Understanding these hallmarks enables targeted therapies — tyrosine kinase inhibitors, anti-VEGF antibodies, and immune checkpoint inhibitors.",
                    duration: 4, entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [{ text: "Mutation → Expansion → Angiogenesis → Invasion → Metastasis", position: [0, 3, 0], offset: [0, 0, 0] }],
                    effect: "doctor_explain"
                }
            ]
        };
    }

    // ======= INFLAMMATION (FIXED) =======
    static inflammationStoryboard(topic) {
        return {
            topic, stages: 7,
            scenes: [
                {
                    step: 1, name: "Tissue Injury", label: "Acute Inflammation",
                    type: "intro",
                    narration: "Tissue damage occurs — whether from infection, trauma, or chemical injury. Damaged cells release DAMPs (damage-associated molecular patterns) like ATP, HMGB1, and uric acid, activating resident macrophages.",
                    duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 5, y: 0, z: 0 } },
                    camera: { distance: 22, angle: 0.3, target: [2, 0, 0] },
                    labels: [{ text: "Tissue damage", position: [3, 1, 0], offset: [0, 1, 0] }, { text: "DAMPs", position: [2, 0.5, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Vasodilation", label: "1. Vascular Response",
                    type: "signaling",
                    narration: "Mast cells degranulate, releasing histamine and prostaglandins. Arterioles dilate, increasing blood flow (causing redness and heat). Endothelial cells contract, creating gaps that increase vascular permeability (causing swelling and edema).",
                    duration: 6, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 0.8, target: [0, 0, 0] },
                    labels: [{ text: "Histamine", position: [1, 1, 0], offset: [0, 0.8, 0] }, { text: "Vasodilation", position: [-1, 2, 0], offset: [0, 0, 0] }, { text: "Increased permeability", position: [0, -1, 0], offset: [0, 0, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 3, name: "Chemotaxis", label: "2. Chemotaxis",
                    type: "signaling",
                    narration: "Activated macrophages and damaged cells release chemokines: IL-8 (CXCL8), C5a, and leukotriene B4. These create a concentration gradient that guides neutrophils from the bloodstream to the injury site.",
                    duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: -2, y: 0, z: 0 }, bacterium: { x: 4, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 1.0, target: [1, 0, 0] },
                    labels: [{ text: "IL-8 / CXCL8", position: [1, 1.5, 0], offset: [0, 0, 0] }, { text: "C5a gradient", position: [2, 0.5, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_point_bacterium"
                },
                {
                    step: 4, name: "Neutrophil Extravasation", label: "3. Neutrophil Recruitment",
                    type: "action",
                    narration: "Neutrophils undergo a multi-step adhesion cascade: rolling (selectin-mediated), activation (chemokine-triggered), firm adhesion (integrin-mediated), and transmigration through the endothelium. They are the first responders, arriving within minutes.",
                    duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 3, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 1.5, target: [1.5, 0, 0] },
                    labels: [{ text: "Selectins (rolling)", position: [2, 0.8, 0], offset: [0, 0.5, 0] }, { text: "Integrins (adhesion)", position: [2, 0, 0], offset: [0.8, 0, 0] }, { text: "Transmigration", position: [1, -0.5, 0], offset: [0, -0.5, 0] }],
                    effect: "extend_pseudopods"
                },
                {
                    step: 5, name: "Phagocytosis", label: "4. Phagocytosis",
                    type: "engulfment",
                    narration: "Neutrophils and macrophages engulf bacteria and cellular debris through phagocytosis. Neutrophils also release NETs (neutrophil extracellular traps) — web-like structures of DNA and enzymes that trap and kill bacteria extracellularly.",
                    duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 1, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 2.0, target: [0, 0, 0] },
                    labels: [{ text: "Engulfment", position: [0.5, 0.8, 0], offset: [0, 0.6, 0] }, { text: "NETs", position: [-1, 1, 0], offset: [-0.8, 0, 0] }],
                    effect: "extend_pseudopods", animation: "engulf"
                },
                {
                    step: 6, name: "Resolution", label: "5. Resolution",
                    type: "resolution",
                    narration: "Anti-inflammatory mediators (IL-10, TGF-β, lipoxins, resolvins) suppress inflammation. Apoptotic neutrophils are cleared by macrophages (efferocytosis), which then switch to anti-inflammatory phenotype. Tissue repair begins.",
                    duration: 6, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 2.5, target: [0, 0, 0] },
                    labels: [{ text: "IL-10, TGF-β", position: [1, 1, 0], offset: [0, 0.5, 0] }, { text: "Efferocytosis", position: [0, 0, 0], offset: [1, 0, 0] }, { text: "Tissue repair", position: [0, 2, 0], offset: [0, 0, 0] }],
                    effect: "doctor_write"
                },
                {
                    step: 7, name: "Complete", label: "Acute Inflammation Complete",
                    type: "summary",
                    narration: "Acute inflammation: Injury → DAMPs → Vasodilation → Chemotaxis → Neutrophil recruitment → Phagocytosis → Resolution. Five cardinal signs: rubor (redness), calor (heat), tumor (swelling), dolor (pain), functio laesa (loss of function).",
                    duration: 4, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [{ text: "DAMPs → Vasodilation → Chemotaxis → Phagocytosis → Resolution", position: [0, 3, 0], offset: [0, 0, 0] }],
                    effect: "doctor_explain"
                }
            ]
        };
    }

    // ======= TUBERCULOSIS =======
    static tbStoryboard(topic) {
        return {
            topic, stages: 7,
            scenes: [
                {
                    step: 1, name: "Inhalation", label: "TB Pathogenesis",
                    type: "intro",
                    narration: "Mycobacterium tuberculosis bacilli (1-4μm) are inhaled into the lungs. Most are cleared by mucociliary escalator, but some reach the alveoli where they encounter alveolar macrophages.",
                    duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 8, y: 2, z: 0 } },
                    camera: { distance: 24, angle: 0.2, target: [4, 1, 0] },
                    labels: [{ text: "Alveolus", position: [0, -1, 0], offset: [0, 0, 0] }, { text: "M. tuberculosis", entity: "bacterium", offset: [0, 1.5, 0] }, { text: "Alveolar macrophage", entity: "macrophage", offset: [-1, 2, 0] }],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Macrophage Uptake", label: "1. Macrophage Entry",
                    type: "recognition",
                    narration: "M. tuberculosis enters macrophages through complement receptors (CR3, CR4) and mannose receptors. Unlike most bacteria, it actively blocks phagosome-lysosome fusion by retaining TACO/coronin-1 on the phagosome surface.",
                    duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 2, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 0.5, target: [1, 0, 0] },
                    labels: [{ text: "CR3 receptor", position: [0.8, 0.4, 0], offset: [0, 0.6, 0] }, { text: "Mannose receptor", position: [0.6, -0.2, 0], offset: [-1, 0, 0] }, { text: "TACO/coronin-1", position: [0, 0.8, 0], offset: [0, 0.5, 0] }],
                    effect: "extend_pseudopods", animation: "engulf"
                },
                {
                    step: 3, name: "Intracellular Survival", label: "2. Immune Evasion",
                    type: "formation",
                    narration: "The bacillus survives inside the macrophage by: blocking phagolysosome fusion, neutralizing reactive oxygen intermediates with lipoarabinomannan (LAM), and preventing acidification. It can also escape the phagosome into the cytoplasm.",
                    duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 1.0, target: [0, 0, 0] },
                    labels: [{ text: "LAM (antioxidant)", position: [0.8, 0.3, 0], offset: [0, 0.5, 0] }, { text: "Blocked fusion", position: [-0.5, 0.5, 0], offset: [-1, 0, 0] }, { text: "Phagosome", position: [0, 0, 0], offset: [0, 1.2, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 4, name: "Granuloma Formation", label: "3. Granuloma",
                    type: "formation",
                    narration: "The immune system walls off the infection by forming a granuloma. Macrophages differentiate into epithelioid cells and multinucleated Langhans giant cells. T cells surround the core, forming a fibrous capsule. Caseous necrosis develops at the center.",
                    duration: 7, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 1.5, target: [0, 0, 0] },
                    labels: [{ text: "Granuloma", position: [0, 0, 0], offset: [0, 2.5, 0] }, { text: "Langhans giant cell", position: [0.5, 0.3, 0], offset: [1.5, 0, 0] }, { text: "Caseous necrosis", position: [0, 0, 0], offset: [-1.5, 0, 0] }, { text: "T cell rim", position: [1.5, 0, 0], offset: [0, 0.5, 0] }],
                    effect: "glow_macrophage"
                },
                {
                    step: 5, name: "Latent TB", label: "4. Latent Infection",
                    type: "formation",
                    narration: "In 90-95% of immunocompetent individuals, the granuloma contains the infection. Bacilli enter a dormant, non-replicating state. The person is tuberculin skin test positive but clinically asymptomatic. Latency can last decades.",
                    duration: 5, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 2.0, target: [0, 0, 0] },
                    labels: [{ text: "Dormant bacilli", position: [0, 0, 0], offset: [0, 1, 0] }, { text: "Intact granuloma", position: [0, 1.5, 0], offset: [0, 0, 0] }],
                    effect: "doctor_write"
                },
                {
                    step: 6, name: "Reactivation", label: "5. Reactivation TB",
                    type: "progression",
                    narration: "When cell-mediated immunity fails (HIV, immunosuppression, aging), bacilli reactivate and multiply. The granuloma caseates and ruptures into a bronchus, creating cavitary lesions. This is when the patient becomes infectious.",
                    duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 3, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 2.5, target: [1, 0, 0] },
                    labels: [{ text: "Cavitary lesion", position: [1, 0.5, 0], offset: [0, 0.8, 0] }, { text: "Reactivation", position: [0, 2, 0], offset: [0, 0, 0] }, { text: "Bacillary multiplication", position: [2, 0, 0], offset: [0, 0.5, 0] }],
                    effect: "doctor_point_bacterium"
                },
                {
                    step: 7, name: "Complete", label: "TB Pathogenesis Complete",
                    type: "summary",
                    narration: "TB: Inhalation → Macrophage entry → Intracellular survival → Granuloma formation → Latency → Reactivation (if immunosuppressed). Treatment requires 6-month multi-drug regimen (RIPE: RifampicIN, Isoniazid, Pyrazinamide, Ethambutol).",
                    duration: 5, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [{ text: "Inhalation → Survival → Granuloma → Latency → Reactivation", position: [0, 3, 0], offset: [0, 0, 0] }],
                    effect: "doctor_explain"
                }
            ]
        };
    }

    // ======= GENERIC STORYBOARD (FIXED: unique per topic) =======
    static generateStoryboard(topic, wikiSummary, allText, facts, researchData) {
        const scenes = [];

        // Analyze topic to determine what kind of process it is
        const topicAnalysis = Synthesizer.analyzeTopic(topic, wikiSummary, allText);

        // Scene 1: Introduction - specific to the topic
        scenes.push({
            step: 1, name: topicAnalysis.introName, label: topic,
            type: "intro",
            narration: topicAnalysis.introNarration,
            duration: 5,
            entities: topicAnalysis.entities,
            positions: topicAnalysis.positions,
            camera: { distance: 22, angle: 0.3, target: topicAnalysis.cameraTarget },
            labels: topicAnalysis.introLabels,
            effect: "doctor_explain"
        });

        // Generate 4-5 scenes from research content
        const allSentences = [];
        if (wikiSummary) allSentences.push(...wikiSummary.split(/[.!?]+/).filter(s => s.trim().length > 15));
        if (researchData.pubmed?.articles) {
            researchData.pubmed.articles.slice(0, 3).forEach(a => { if (a.title) allSentences.push(a.title); });
        }
        if (researchData.openalex?.articles) {
            researchData.openalex.articles.slice(0, 3).forEach(a => { if (a.title) allSentences.push(a.title); });
        }

        const uniqueSentences = [...new Set(allSentences)].slice(0, 5);

        uniqueSentences.forEach((sentence, i) => {
            const stepNum = i + 2;
            const stepAnalysis = Synthesizer.analyzeStep(sentence, topic, topicAnalysis);
            scenes.push({
                step: stepNum,
                name: stepAnalysis.name,
                label: stepNum + ". " + stepAnalysis.name,
                type: stepAnalysis.type,
                narration: sentence.trim() + ".",
                duration: stepAnalysis.duration,
                entities: topicAnalysis.entities,
                positions: stepAnalysis.positions,
                camera: { distance: stepAnalysis.cameraDistance, angle: stepAnalysis.cameraAngle, target: [0, 0, 0] },
                labels: stepAnalysis.labels,
                effect: stepAnalysis.effect
            });
        });

        // Summary scene - unique to topic
        scenes.push({
            step: scenes.length + 1, name: "Summary", label: topic + " - Complete",
            type: "summary",
            narration: topicAnalysis.summaryNarration,
            duration: 5,
            entities: topicAnalysis.entities,
            positions: topicAnalysis.positions,
            camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
            labels: [{ text: topicAnalysis.pathwayText, position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        return { topic, stages: scenes.length, scenes };
    }

    // ======= TOPIC ANALYZER (unique per topic) =======
    static analyzeTopic(topic, wikiSummary, allText) {
        const lower = topic.toLowerCase();
        const text = (wikiSummary + " " + allText).toLowerCase();

        // Determine entities
        let entities = ["macrophage", "bacterium"];
        let positions = { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 8, y: 0, z: 0 } };
        let cameraTarget = [4, 0, 0];

        if (lower.match(/cell|organ|tissue|muscle|heart|liver|kidney|lung|brain|neuron|nerve/)) {
            entities = ["human_cell"];
            positions = { human_cell: { x: 0, y: 0, z: 0 } };
            cameraTarget = [0, 0, 0];
        } else if (lower.match(/virus|viral|hiv|influenza|covid/)) {
            entities = ["macrophage", "bacterium"];
            positions = { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 1, z: 0 } };
            cameraTarget = [3, 0.5, 0];
        }

        // Determine intro based on topic type
        let introName = "Introduction";
        let introNarration = "Let us explore " + topic + ". ";
        let introLabels = [{ text: topic, position: [0, 3, 0], offset: [0, 0, 0] }];

        if (text.match(/process|pathway|mechanism|cascade/)) {
            introNarration += "This is a biological process involving multiple sequential steps and molecular interactions.";
            introLabels.push({ text: "Process overview", position: [0, 2, 0], offset: [0, 0, 0] });
        } else if (text.match(/disease|infection|patholog|disorder/)) {
            introNarration += "This is a pathological condition involving disruption of normal physiological processes.";
            introLabels.push({ text: "Pathological condition", position: [0, 2, 0], offset: [0, 0, 0] });
        } else if (text.match(/structure|anatomy|morpholog/)) {
            introNarration += "This is an anatomical structure with specific morphological features.";
            introLabels.push({ text: "Anatomical structure", position: [0, 2, 0], offset: [0, 0, 0] });
        } else {
            introNarration += "Understanding this topic requires knowledge of its underlying mechanisms and clinical significance.";
            introLabels.push({ text: "Medical concept", position: [0, 2, 0], offset: [0, 0, 0] });
        }

        // Summary - unique per topic
        let summaryNarration = topic + " involves multiple interconnected steps. ";
        let pathwayText = "";
        if (text.match(/process|pathway|mechanism/)) {
            summaryNarration += "Understanding each step is essential for clinical diagnosis and treatment.";
            pathwayText = "Multiple steps in " + topic + " pathway";
        } else if (text.match(/disease|infection/)) {
            summaryNarration += "Knowledge of the pathogenesis guides therapeutic intervention.";
            pathwayText = "Pathogenesis: " + topic;
        } else {
            summaryNarration += "This knowledge forms the foundation for clinical practice.";
            pathwayText = "Key concepts in " + topic;
        }

        return {
            entities, positions, cameraTarget,
            introName, introNarration, introLabels,
            summaryNarration, pathwayText
        };
    }

    // ======= STEP ANALYZER (unique per sentence) =======
    static analyzeStep(sentence, topic, topicAnalysis) {
        const lower = sentence.toLowerCase();

        // Determine step type
        let type = "description";
        let name = "Step";
        let effect = "doctor_explain";
        let duration = 4;
        let cameraDistance = 16;
        let cameraAngle = 0.5;
        let positions = topicAnalysis.positions;
        let labels = [{ text: topic, position: [0, 2.5, 0], offset: [0, 0, 0] }];

        if (lower.match(/first|initial|begin|start|trigger|cause|origin/)) {
            type = "trigger"; name = "Trigger"; effect = "doctor_explain";
            cameraDistance = 18; cameraAngle = 0.3;
        } else if (lower.match(/detect|recogni|identif|bind|attach|receptor/)) {
            type = "recognition"; name = "Recognition"; effect = "glow_macrophage";
            cameraDistance = 14; cameraAngle = 0.6;
            labels = [{ text: "Recognition event", position: [1, 0.5, 0], offset: [0, 0.7, 0] }];
        } else if (lower.match(/signal|activat|stimulat|trigger|phosphorylat/)) {
            type = "signaling"; name = "Signaling"; effect = "glow_macrophage";
            cameraDistance = 12; cameraAngle = 1.0;
            labels = [{ text: "Signal transduction", position: [0, 0.5, 0], offset: [0, 0.7, 0] }];
        } else if (lower.match(/releas|secrete|discharg|synth|produc|generat/)) {
            type = "action"; name = "Release"; effect = "doctor_point_bacterium";
            cameraDistance = 14; cameraAngle = 1.2;
            labels = [{ text: "Active process", position: [0, 1, 0], offset: [0, 0.7, 0] }];
        } else if (lower.match(/engulf|phagocyt|internali|uptak|endocyt/)) {
            type = "engulfment"; name = "Uptake"; effect = "extend_pseudopods";
            cameraDistance = 10; cameraAngle = 1.5;
            labels = [{ text: "Cellular uptake", position: [0.5, 0.5, 0], offset: [0, 0.6, 0] }];
            duration = 5;
        } else if (lower.match(/spread|dissem|infect|invas|metastas|migrat/)) {
            type = "progression"; name = "Progression"; effect = "doctor_point_bacterium";
            cameraDistance = 16; cameraAngle = 2.0;
            labels = [{ text: "Disease progression", position: [2, 0, 0], offset: [0, 0.5, 0] }];
        } else if (lower.match(/repair|heal|resolv|restor|recover|clear/)) {
            type = "resolution"; name = "Resolution"; effect = "doctor_write";
            cameraDistance = 18; cameraAngle = 2.5;
            labels = [{ text: "Resolution phase", position: [0, 2, 0], offset: [0, 0, 0] }];
        } else if (lower.match(/damage|destroy|degrad|kill|toxic|necrosis/)) {
            type = "destruction"; name = "Damage"; effect = "destroy";
            cameraDistance = 10; cameraAngle = 2.0;
            labels = [{ text: "Tissue damage", position: [0, 0.5, 0], offset: [0, 0.7, 0] }];
        } else if (lower.match(/divid|prolifer|replicat|growth|multiply/)) {
            type = "progression"; name = "Proliferation"; effect = "glow_macrophage";
            cameraDistance = 14; cameraAngle = 1.5;
            labels = [{ text: "Cellular proliferation", position: [0, 1.5, 0], offset: [0, 0, 0] }];
        } else if (lower.match(/transport|move|travel|transloc/)) {
            type = "action"; name = "Transport"; effect = "doctor_point_bacterium";
            cameraDistance = 16; cameraAngle = 1.0;
            labels = [{ text: "Transport mechanism", position: [1, 0, 0], offset: [0.8, 0, 0] }];
        } else {
            // Generic step
            name = Synthesizer.nameStep(sentence, topic);
            effect = ["doctor_explain", "doctor_write", "glow_macrophage", "doctor_point_bacterium", "doctor_point_macrophage"][Math.floor(Math.random() * 5)];
        }

        return { type, name, effect, duration, cameraDistance, cameraAngle, positions, labels };
    }

    // ======= FACTS & SOURCES =======
    static extractFacts(research, topic) {
        const facts = [];
        if (research.wikipedia?.summary) {
            research.wikipedia.summary.split(/[.!?]+/).filter(s => s.trim().length > 10).forEach(s => {
                facts.push({ text: s.trim(), source: "Wikipedia", confidence: 0.9 });
            });
        }
        if (research.pubmed?.articles) research.pubmed.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "PubMed", confidence: 0.85 }); });
        if (research.openalex?.articles) research.openalex.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "OpenAlex", confidence: 0.8 }); });
        if (research.crossref?.articles) research.crossref.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "CrossRef", confidence: 0.7 }); });
        if (research.semanticScholar?.articles) research.semanticScholar.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "SemanticScholar", confidence: 0.8 }); });
        if (research.duckduckgo?.abstract) {
            research.duckduckgo.abstract.split(/[.!?]+/).filter(s => s.trim().length > 10).forEach(s => {
                facts.push({ text: s.trim(), source: "DuckDuckGo", confidence: 0.75 });
            });
        }
        return Synthesizer.deduplicate(facts);
    }

    static getAllText(research, topic) {
        let text = topic + ". ";
        if (research.wikipedia?.summary) text += research.wikipedia.summary + " ";
        if (research.pubmed?.articles) research.pubmed.articles.forEach(a => { text += (a.title || "") + ". "; });
        if (research.openalex?.articles) research.openalex.articles.forEach(a => { text += (a.title || "") + ". "; });
        return text;
    }

    static nameStep(sentence, topic) {
        const lower = sentence.toLowerCase();
        if (lower.match(/enter|inhale|expose|contact|infect/)) return "Exposure";
        if (lower.match(/detect|recogni|identif|bind|attach/)) return "Recognition";
        if (lower.match(/signal|activat|stimulat|trigger/)) return "Activation";
        if (lower.match(/releas|secrete|discharg/)) return "Release";
        if (lower.match(/engulf|phagocyt|internali|uptak/)) return "Engulfment";
        if (lower.match(/synth|produc|generat|creat/)) return "Production";
        if (lower.match(/transport|move|travel|migrat/)) return "Transport";
        if (lower.match(/digest|degrad|destroy|kill|lysis/)) return "Destruction";
        if (lower.match(/fus|merg|combin/)) return "Fusion";
        if (lower.match(/divid|prolifer|replicat/)) return "Proliferation";
        if (lower.match(/differentiat|specializ|transform/)) return "Differentiation";
        if (lower.match(/repair|heal|recover|restor/)) return "Repair";
        if (lower.match(/inhibit|block|suppress|prevent/)) return "Inhibition";
        if (lower.match(/is a|are|refers to/)) return "Definition";
        return "Step";
    }

    static classifyStep(sentence) {
        const lower = sentence.toLowerCase();
        if (lower.match(/first|initial|begin|start|trigger|cause/)) return "trigger";
        if (lower.match(/detect|recogni|identif|bind/)) return "recognition";
        if (lower.match(/signal|activat|stimulat/)) return "signaling";
        if (lower.match(/releas|secrete|produc|synth|engulf|kill|destroy/)) return "action";
        if (lower.match(/spread|dissem|infect|invas/)) return "progression";
        if (lower.match(/repair|heal|resolv|restor|recover/)) return "resolution";
        return "description";
    }

    static buildQuiz(topic, storyboard, research) {
        const questions = [];
        const scenes = storyboard.scenes.filter(s => s.type !== "intro" && s.type !== "summary");

        if (scenes.length > 0) {
            questions.push({
                question: "What is the FIRST step in " + topic + "?",
                options: [scenes[0].name, "Digestion", "Summary", "Cleanup"],
                correct: 0,
                explanation: scenes[0].narration
            });
        }

        if (scenes.length > 2) {
            const mid = scenes[Math.floor(scenes.length / 2)];
            questions.push({
                question: "During " + topic + ", what happens at the " + mid.name.toLowerCase() + " stage?",
                options: [mid.narration.substring(0, 100), "Nothing happens", "The process stops", "All cells die"],
                correct: 0,
                explanation: mid.narration
            });
        }

        if (scenes.length > 0) {
            const last = scenes[scenes.length - 1];
            questions.push({
                question: "What is the final stage of " + topic + "?",
                options: [last.name, "Initialization", "Recognition", "Attachment"],
                correct: 0,
                explanation: last.narration
            });
        }

        questions.push({
            question: "How many stages are in " + topic + "?",
            options: [scenes.length + " stages", "2 stages", "Only 1 stage", "100 stages"],
            correct: 0,
            explanation: topic + " has " + scenes.length + " documented stages."
        });

        return questions.slice(0, 6);
    }

    static deduplicate(facts) {
        const unique = [];
        const seen = new Set();
        for (const fact of facts) {
            const key = fact.text.toLowerCase().substring(0, 40);
            if (!seen.has(key)) { seen.add(key); unique.push(fact); }
        }
        return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 40);
    }

    static summarizeSources(research) {
        const sources = [];
        if (research.pubmed?.count > 0) sources.push("PubMed: " + research.pubmed.count);
        if (research.openalex?.count > 0) sources.push("OpenAlex: " + research.openalex.count);
        if (research.crossref?.count > 0) sources.push("CrossRef: " + research.crossref.count);
        if (research.semanticScholar?.count > 0) sources.push("SemanticScholar: " + research.semanticScholar.count);
        if (research.wikipedia) sources.push("Wikipedia: " + research.wikipedia.title);
        return sources;
    }
}

module.exports = Synthesizer;
