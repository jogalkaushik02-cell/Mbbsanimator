// ============================================
// Synthesizer - Storyboard-first animation system
// Each topic gets proper scene-by-scene breakdown
// with biological accuracy
// ============================================

class Synthesizer {

    static synthesize(topic, researchData) {
        const facts = Synthesizer.extractFacts(researchData, topic);
        const wikiSummary = researchData.wikipedia?.summary || "";
        const allText = Synthesizer.getAllText(researchData, topic);

        // Try pre-built storyboard first, then generate from research
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

    // ======= PRE-BUILT STORYBOARD: PHAGOCYTOSIS =======
    static phagocytosisStoryboard() {
        return {
            topic: "Phagocytosis",
            stages: 5,
            scenes: [
                {
                    step: 1, name: "Identify Cells", label: "Phagocytosis",
                    type: "intro",
                    narration: "This is a macrophage, a large immune cell. Nearby is a pathogenic bacterium. The macrophage will now detect and eliminate this threat.",
                    duration: 5,
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 8, y: 0, z: 0 } },
                    camera: { distance: 22, angle: 0.3, target: [4, 0, 0] },
                    labels: [
                        { text: "Macrophage", entity: "macrophage", offset: [0, 2, 0] },
                        { text: "Bacterium", entity: "bacterium", offset: [0, 1.5, 0] }
                    ],
                    effect: "doctor_explain"
                },
                {
                    step: 2, name: "Recognition & Attachment", label: "1. Recognition & Attachment",
                    type: "recognition",
                    narration: "The bacterium approaches the macrophage. Receptors on the macrophage membrane recognize pathogen-associated molecular patterns on the bacterial surface. This is receptor-mediated recognition, not random contact.",
                    duration: 6,
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 3, y: 0, z: 0 } },
                    camera: { distance: 16, angle: 0.5, target: [1.5, 0, 0] },
                    labels: [
                        { text: "Macrophage", entity: "macrophage", offset: [-1, 2, 0] },
                        { text: "Pathogen", entity: "bacterium", offset: [0, 1.5, 0] },
                        { text: "Receptor binding", position: [1.5, 0.5, 0], offset: [0, 1, 0] }
                    ],
                    effect: "bacterium_swim",
                    animation: "recognition"
                },
                {
                    step: 3, name: "Engulfment", label: "2. Engulfment",
                    type: "engulfment",
                    narration: "The macrophage membrane extends pseudopod projections around the bacterium. The pseudopods surround the pathogen and the membrane closes, forming an intracellular vesicle. The engulfment originates from the cell membrane.",
                    duration: 7,
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 0.5, y: 0, z: 0 } },
                    camera: { distance: 14, angle: 0.8, target: [0, 0, 0] },
                    labels: [
                        { text: "Pseudopods", position: [0.8, 0.8, 0], offset: [0, 1, 0] },
                        { text: "Engulfing membrane", position: [0, 1.2, 0], offset: [0, 0.8, 0] }
                    ],
                    effect: "extend_pseudopods",
                    animation: "engulf"
                },
                {
                    step: 4, name: "Phagosome Formation", label: "3. Phagosome Formation",
                    type: "formation",
                    narration: "The membrane completely surrounds the bacterium and pinches off from the plasma membrane. The bacterium is now enclosed inside a phagosome, an intracellular vesicle within the cytoplasm.",
                    duration: 5,
                    entities: ["macrophage", "bacterium", "phagosome"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 0, y: 0, z: 0 }, phagosome: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 1.0, target: [0, 0, 0] },
                    labels: [
                        { text: "Phagosome", entity: "phagosome", offset: [0, 1.5, 0] },
                        { text: "Cytoplasm", position: [-2, 1, 0], offset: [0, 0, 0] }
                    ],
                    effect: "form_phagosome",
                    animation: "phagosome_formation"
                },
                {
                    step: 5, name: "Lysosome Fusion", label: "4. Phagolysosome Formation",
                    type: "fusion",
                    narration: "Lysosomes containing digestive enzymes move through the cytoplasm toward the phagosome. A lysosome fuses with the phagosome, creating a phagolysosome. The combined compartment has an acidic environment and powerful enzymes.",
                    duration: 6,
                    entities: ["macrophage", "phagolysosome"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, phagolysosome: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 12, angle: 1.5, target: [0, 0, 0] },
                    labels: [
                        { text: "Lysosome", position: [1, 0.8, 0], offset: [0, 0.8, 0] },
                        { text: "Phagolysosome", entity: "phagolysosome", offset: [0, 1.5, 0] }
                    ],
                    effect: "fuse_lysosomes",
                    animation: "lysosome_fusion"
                },
                {
                    step: 6, name: "Killing & Digestion", label: "5. Killing & Digestion",
                    type: "destruction",
                    narration: "Inside the phagolysosome, lysosomal enzymes, reactive oxygen species, and an acidic pH break down the bacterium. The bacterial structure progressively degrades into smaller fragments.",
                    duration: 6,
                    entities: ["macrophage", "phagolysosome"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, phagolysosome: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 10, angle: 2.0, target: [0, 0, 0] },
                    labels: [
                        { text: "Enzymatic digestion", position: [0, 0.5, 0], offset: [0, 1, 0] },
                        { text: "ROS + Acid", position: [0.8, 0, 0], offset: [0, 0.8, 0] }
                    ],
                    effect: "destroy",
                    animation: "digestion"
                },
                {
                    step: 7, name: "Complete", label: "Phagocytosis Complete",
                    type: "summary",
                    narration: "The complete pathway: Recognition leads to Attachment, which triggers Engulfment by pseudopods, forming a Phagosome. Lysosome fusion creates a Phagolysosome, where enzymatic Killing and Digestion destroys the pathogen.",
                    duration: 5,
                    entities: ["macrophage"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 } },
                    camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                    labels: [
                        { text: "Pathway: Recognition → Engulfment → Phagosome → Phagolysosome → Digestion", position: [0, 3, 0], offset: [0, 0, 0] }
                    ],
                    effect: "doctor_explain",
                    animation: "summary"
                }
            ]
        };
    }

    // ======= STORYBOARD BUILDER FROM TOPIC =======
    static getStoryboard(topic, wikiSummary, allText, facts, researchData) {
        const lower = topic.toLowerCase();

        // Check for pre-built storyboards
        if (lower.includes("phagocytosis")) return Synthesizer.phagocytosisStoryboard();
        if (lower.includes("inflammation") && lower.includes("acute")) return Synthesizer.inflammationStoryboard(topic);
        if (lower.includes("tuberculosis") || lower.match(/\btb\b/)) return Synthesizer.tbStoryboard(topic);

        // Generate storyboard from research
        return Synthesizer.generateStoryboard(topic, wikiSummary, allText, facts, researchData);
    }

    // ======= GENERIC STORYBOARD FROM RESEARCH =======
    static generateStoryboard(topic, wikiSummary, allText, facts, researchData) {
        const scenes = [];
        const sentences = wikiSummary.split(/[.!?]+/).filter(s => s.trim().length > 15);

        // Scene 1: Introduction
        scenes.push({
            step: 1, name: "Introduction", label: topic,
            type: "intro",
            narration: "Let us explore " + topic + ". " + (sentences[0] || topic + " is an important concept in medicine."),
            duration: 5,
            entities: ["macrophage", "bacterium"],
            positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 8, y: 0, z: 0 } },
            camera: { distance: 22, angle: 0.3, target: [4, 0, 0] },
            labels: [{ text: topic, position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        // Generate scenes from research content
        const allSentences = [];
        if (wikiSummary) allSentences.push(...wikiSummary.split(/[.!?]+/).filter(s => s.trim().length > 15));
        if (researchData.pubmed?.articles) {
            researchData.pubmed.articles.slice(0, 3).forEach(a => { if (a.title) allSentences.push(a.title); });
        }
        if (researchData.openalex?.articles) {
            researchData.openalex.articles.slice(0, 3).forEach(a => { if (a.title) allSentences.push(a.title); });
        }

        const effects = ["doctor_point_bacterium", "doctor_write", "glow_macrophage", "doctor_point_macrophage", "doctor_explain"];
        const cameraAngles = [0.5, 1.0, 1.5, 2.0, 2.5];

        allSentences.slice(0, 5).forEach((sentence, i) => {
            const stepNum = i + 2;
            scenes.push({
                step: stepNum,
                name: Synthesizer.nameStep(sentence, topic),
                label: stepNum + ". " + Synthesizer.nameStep(sentence, topic),
                type: Synthesizer.classifyStep(sentence),
                narration: sentence.trim() + ".",
                duration: 4,
                entities: ["macrophage", "bacterium"],
                positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 5 - i, y: 0, z: 0 } },
                camera: { distance: 18 - (i * 1), angle: cameraAngles[i % cameraAngles.length], target: [0, 0, 0] },
                labels: [{ text: Synthesizer.nameStep(sentence, topic), position: [0, 2.5, 0], offset: [0, 0, 0] }],
                effect: effects[i % effects.length]
            });
        });

        // Summary scene
        scenes.push({
            step: scenes.length + 1, name: "Summary", label: topic + " - Summary",
            type: "summary",
            narration: topic + " involves " + scenes.length + " documented steps. " + facts.length + " research findings support this understanding.",
            duration: 4,
            entities: ["macrophage"],
            positions: { macrophage: { x: 0, y: 0, z: 0 } },
            camera: { distance: 22, angle: 3.0, target: [0, 0, 0] },
            labels: [{ text: topic + " Complete", position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        return { topic, stages: scenes.length, scenes };
    }

    static inflammationStoryboard(topic) {
        return {
            topic, stages: 6,
            scenes: [
                { step: 1, name: "Tissue Damage", label: "Acute Inflammation", type: "intro", narration: "Tissue damage has occurred. Damaged cells release DAMPs and chemical signals that alert the immune system.", duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 5, y: 0, z: 0 } }, camera: { distance: 22, angle: 0.3, target: [2, 0, 0] }, labels: [{ text: "Damaged tissue", position: [3, 1, 0], offset: [0, 1, 0] }], effect: "doctor_explain" },
                { step: 2, name: "Vasodilation", label: "1. Vasodilation", type: "recognition", narration: "Mast cells release histamine. Blood vessels dilate, increasing blood flow to the area. Vascular permeability increases, allowing fluid and proteins to enter the tissue.", duration: 5, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } }, camera: { distance: 18, angle: 0.8, target: [0, 0, 0] }, labels: [{ text: "Histamine release", position: [1, 1, 0], offset: [0, 0.8, 0] }, { text: "Vasodilation", position: [-1, 2, 0], offset: [0, 0, 0] }], effect: "glow_macrophage" },
                { step: 3, name: "Neutrophil Recruitment", label: "2. Neutrophil Recruitment", type: "signaling", narration: "Chemotactic factors released at the damage site attract neutrophils from the bloodstream. Neutrophils squeeze through vessel walls and migrate toward the site.", duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: -2, y: 0, z: 0 }, bacterium: { x: 4, y: 0, z: 0 } }, camera: { distance: 18, angle: 1.0, target: [1, 0, 0] }, labels: [{ text: "Chemotaxis", position: [1, 1.5, 0], offset: [0, 0, 0] }], effect: "doctor_point_bacterium" },
                { step: 4, name: "Phagocytosis", label: "3. Phagocytosis", type: "engulfment", narration: "Neutrophils and macrophages engulf bacteria and debris through phagocytosis. The pathogen is engulfed, enclosed in a phagosome, and destroyed by enzymes and reactive oxygen species.", duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 1, y: 0, z: 0 } }, camera: { distance: 14, angle: 1.5, target: [0, 0, 0] }, labels: [{ text: "Engulfment", position: [0.5, 1, 0], offset: [0, 0.8, 0] }], effect: "extend_pseudopods", animation: "engulf" },
                { step: 5, name: "Resolution", label: "4. Resolution", type: "resolution", narration: "The infection is cleared. Anti-inflammatory signals promote resolution. Tissue repair begins. Dead neutrophils are cleared by macrophages through efferocytosis.", duration: 5, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } }, camera: { distance: 18, angle: 2.0, target: [0, 0, 0] }, labels: [{ text: "Tissue repair", position: [0, 2, 0], offset: [0, 0, 0] }], effect: "doctor_write" },
                { step: 6, name: "Complete", label: "Acute Inflammation Complete", type: "summary", narration: "Acute inflammation: Tissue damage triggers vasodilation, neutrophil recruitment, phagocytosis, and eventual resolution. This is the body's first line of defense.", duration: 4, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } }, camera: { distance: 22, angle: 3.0, target: [0, 0, 0] }, labels: [{ text: "Vasodilation → Recruitment → Phagocytosis → Resolution", position: [0, 3, 0], offset: [0, 0, 0] }], effect: "doctor_explain" }
            ]
        };
    }

    static tbStoryboard(topic) {
        return {
            topic, stages: 6,
            scenes: [
                { step: 1, name: "Inhalation", label: "TB Pathogenesis", type: "intro", narration: "Mycobacterium tuberculosis bacilli are inhaled into the lungs and reach the alveoli.", duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 8, y: 2, z: 0 } }, camera: { distance: 24, angle: 0.2, target: [4, 1, 0] }, labels: [{ text: "Alveolus", position: [0, -1, 0], offset: [0, 0, 0] }, { text: "M. tuberculosis", entity: "bacterium", offset: [0, 1.5, 0] }], effect: "doctor_explain" },
                { step: 2, name: "Macrophage Uptake", label: "1. Alveolar Macrophage Uptake", type: "recognition", narration: "Alveolar macrophages engulf the bacilli through phagocytosis. However, M. tuberculosis has evolved mechanisms to survive inside the macrophage.", duration: 6, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 2, y: 0, z: 0 } }, camera: { distance: 16, angle: 0.5, target: [1, 0, 0] }, labels: [{ text: "Macrophage", entity: "macrophage", offset: [-1, 2, 0] }, { text: "Bacillus", entity: "bacterium", offset: [0, 1.5, 0] }], effect: "extend_pseudopods", animation: "engulf" },
                { step: 3, name: "Granuloma Formation", label: "2. Granuloma Formation", type: "formation", narration: "The immune system walls off the infection by forming a granuloma. Macrophages fuse into multinucleated giant cells, surrounded by T cells.", duration: 6, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } }, camera: { distance: 16, angle: 1.0, target: [0, 0, 0] }, labels: [{ text: "Granuloma", position: [0, 0, 0], offset: [0, 2, 0] }, { text: "Giant cells", position: [0.5, 0, 0], offset: [1.5, 0, 0] }], effect: "glow_macrophage" },
                { step: 4, name: "Latent Infection", label: "3. Latent TB Infection", type: "formation", narration: "The bacteria persist in a dormant state within the granuloma. About 90% of infected individuals contain the infection and remain asymptomatic.", duration: 5, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } }, camera: { distance: 18, angle: 1.5, target: [0, 0, 0] }, labels: [{ text: "Latent infection", position: [0, 2, 0], offset: [0, 0, 0] }], effect: "doctor_write" },
                { step: 5, name: "Reactivation", label: "4. Reactivation (if immunity weakens)", type: "progression", narration: "When immune surveillance fails, the bacteria reactivate and multiply. The granuloma breaks down, allowing bacteria to spread through the lungs.", duration: 5, entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 3, y: 0, z: 0 } }, camera: { distance: 18, angle: 2.0, target: [1, 0, 0] }, labels: [{ text: "Reactivation", position: [1, 1.5, 0], offset: [0, 0, 0] }], effect: "doctor_point_bacterium" },
                { step: 6, name: "Complete", label: "TB Pathogenesis Complete", type: "summary", narration: "TB Pathogenesis: Inhalation → Macrophage Uptake → Granuloma Formation → Latent Infection → possible Reactivation. Understanding this pathway is crucial for treatment.", duration: 4, entities: ["macrophage"], positions: { macrophage: { x: 0, y: 0, z: 0 } }, camera: { distance: 22, angle: 3.0, target: [0, 0, 0] }, labels: [{ text: "Inhalation → Uptake → Granuloma → Latency → Reactivation", position: [0, 3, 0], offset: [0, 0, 0] }], effect: "doctor_explain" }
            ]
        };
    }

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
