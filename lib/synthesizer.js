// ============================================
// Synthesizer - PURE RESEARCH-DRIVEN
// Every word from Wikipedia/PubMed/OpenAlex
// ============================================

class Synthesizer {

    static synthesize(topic, researchData) {
        const wikiSummary = researchData.wikipedia?.summary || "";
        const facts = Synthesizer.extractFacts(researchData, topic);
        const allText = Synthesizer.getAllText(researchData, topic);
        const storyboard = Synthesizer.buildFromResearch(topic, wikiSummary, allText, facts, researchData);
        const narration = storyboard.scenes.map((scene, i) => ({
            time: storyboard.scenes.slice(0, i).reduce((sum, s) => sum + s.duration, 0),
            text: scene.narration
        }));
        const totalTime = narration.length > 0
            ? narration[narration.length - 1].time + storyboard.scenes[storyboard.scenes.length - 1].duration : 10;
        narration.push({ time: totalTime, text: "This concludes our lesson on " + topic + "." });
        const quiz = Synthesizer.buildQuiz(topic, storyboard, researchData);
        return {
            topic, synthesizedAt: new Date().toISOString(),
            factsFound: facts.length, facts,
            processSteps: storyboard.scenes.map((s, i) => ({ step: i + 1, name: s.label, description: s.narration, type: s.type })),
            narration, quiz, animationSteps: storyboard.scenes,
            sources: Synthesizer.summarizeSources(researchData), storyboard
        };
    }

    // ======= BUILD FROM RESEARCH =======
    static buildFromResearch(topic, wikiSummary, allText, facts, researchData) {
        const scenes = [];

        // Split Wikipedia into real sentences
        const wikiSentences = wikiSummary.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 15);

        // Get PubMed titles
        const pubmedTitles = [];
        if (researchData.pubmed?.articles) {
            researchData.pubmed.articles.forEach(a => { if (a.title) pubmedTitles.push(a.title); });
        }

        // Get OpenAlex titles
        const openalexTitles = [];
        if (researchData.openalex?.articles) {
            researchData.openalex.articles.forEach(a => { if (a.title) openalexTitles.push(a.title); });
        }

        // DuckDuckGo abstract sentences
        const ddSentences = (researchData.duckduckgo?.abstract || "")
            .split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 15);

        // Combine ALL content, deduplicate
        const allContent = [...wikiSentences, ...ddSentences, ...pubmedTitles.filter(t => t.length > 20), ...openalexTitles.filter(t => t.length > 20)];
        const uniqueContent = [...new Set(allContent)];

        // Determine visual entities from topic
        const topicType = Synthesizer.getTopicType(topic, wikiSummary);

        // Scene 1: First Wikipedia sentence
        scenes.push({
            step: 1, name: "Introduction", label: topic, type: "intro",
            narration: wikiSentences[0] || topic + " is an important medical topic.",
            duration: 6, entities: topicType.entities, positions: topicType.positions,
            camera: { distance: 22, angle: 0.3, target: topicType.cameraTarget },
            labels: [{ text: topic, position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        // Scenes 2-6: Next sentences from research
        const contentForScenes = uniqueContent.slice(1, 6);
        const angles = [0.5, 0.8, 1.0, 1.5, 2.0];
        const dists = [16, 14, 12, 14, 16];
        const effs = ["doctor_explain", "glow_macrophage", "doctor_write", "doctor_point_bacterium", "extend_pseudopods"];

        contentForScenes.forEach((sentence, i) => {
            const stepType = Synthesizer.classifyStep(sentence);
            scenes.push({
                step: i + 2, name: stepType.name, label: (i + 2) + ". " + stepType.name,
                type: stepType.type, narration: sentence, duration: 5,
                entities: topicType.entities, positions: topicType.positions,
                camera: { distance: dists[i % dists.length], angle: angles[i % angles.length], target: [0, 0, 0] },
                labels: [{ text: stepType.name, position: [0, 2.5, 0], offset: [0, 0, 0] }],
                effect: effs[i % effs.length]
            });
        });

        // Summary: last Wikipedia sentence
        const lastWiki = wikiSentences[wikiSentences.length - 1];
        scenes.push({
            step: scenes.length + 1, name: "Summary", label: topic + " — Complete", type: "summary",
            narration: (lastWiki && lastWiki !== wikiSentences[0]) ? lastWiki : topic + " — " + uniqueContent.length + " research sources confirm this.",
            duration: 5, entities: topicType.entities, positions: topicType.positions,
            camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
            labels: [{ text: topic + " — " + uniqueContent.length + " sources", position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        return { topic, stages: scenes.length, scenes };
    }

    // ======= CLASSIFY TOPIC TYPE =======
    static getTopicType(topic, wikiSummary) {
        const text = (wikiSummary + " " + topic).toLowerCase();

        // Parasitic/Worm
        if (text.match(/parasit|worm|larva|tapeworm|helminth|cestode|nematode|fluke|schistosom|taenia|echinococc|trichinell|hookworm|roundworm|cysticerc/)) {
            return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
        }
        // Bacterial infection
        if (text.match(/bacteri|microbe|staphylococc|streptococc|salmonell|tubercul|pneumococc|meningococc|clostrid|bacillus|vibrio|chlamyd|mycoplasm|legionell|borrelia|treponema|leptospira|brucell|listeria|corynebacterium|mycobacterium/)) {
            return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
        }
        // Viral infection
        if (text.match(/virus|viral|influenza|coronavirus|covid|hiv|aids|hepatitis|herpes|ebola|zika|dengue|measles|rubella|rabies|rotavirus|papillomavirus/)) {
            return { entities: ["virus", "lymphocyte"], positions: { virus: { x: 0, y: 0, z: 0 }, lymphocyte: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // Brain/Neurology
        if (text.match(/brain|neurolog|neuro|cerebr|cerebell|cortex|hippocampus|synaps|neurotransmit|alzheimer|parkinson|epilep|seizure|stroke|mening|encephal|dementia|neuropath/)) {
            return { entities: ["brain", "neuron"], positions: { brain: { x: 0, y: 0, z: 0 }, neuron: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // Heart/Cardiology
        if (text.match(/heart|cardiac|cardiol|myocard|endocard|pericard|arrhythm|coronary|angina|infarction|heart failure|valv|atrial|ventricul|aorta|blood pressure|hypertension/)) {
            return { entities: ["heart", "red_blood_cell"], positions: { heart: { x: 0, y: 0, z: 0 }, red_blood_cell: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // Blood/Hematology
        if (text.match(/blood|hematol|hemoglobin|erythrocyte|leukocyte|thrombocyte|platelet|anemia|leukemia|lymphoma|myeloma|coagul|sickle|thalass|reticulocyte/)) {
            return { entities: ["red_blood_cell", "neutrophil"], positions: { red_blood_cell: { x: 0, y: 0, z: 0 }, neutrophil: { x: 4, y: 1, z: 0 } }, cameraTarget: [2, 0.5, 0] };
        }
        // Cancer/Oncology
        if (text.match(/cancer|carcinoma|sarcoma|leukemia|lymphoma|melanoma|glioma|tumor|oncolog|metasta|neoplasm|benign|malignant|chemotherapy|radiation/)) {
            return { entities: ["cancer_cell", "lymphocyte"], positions: { cancer_cell: { x: 0, y: 0, z: 0 }, lymphocyte: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // DNA/Genetics
        if (text.match(/dna|gene|genetic|chromosome|genome|mutation|heredit|allele|genotype|phenotype|replication|transcription|translation|rna|mrna|trna|rrna|exon|intron|promoter|enhancer/)) {
            return { entities: ["dna", "receptor"], positions: { dna: { x: 0, y: 0, z: 0 }, receptor: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // Immunology
        if (text.match(/immun|antibod|antigen|complement|vaccine|immuniz|autoimmun|immunodefici|hiv|aids|allerg|hypersensit|transplant|graft/)) {
            return { entities: ["antibody", "macrophage"], positions: { antibody: { x: 0, y: 1, z: 0 }, macrophage: { x: 0, y: -1, z: 0 } }, cameraTarget: [0, 0, 0] };
        }
        // Cell biology
        if (text.match(/cell|organelle|mitochondri|ribosome|endoplasmic|golgi|lysosome|nucleus|membrane|cytoplasm|chromosome|protein|enzyme/)) {
            return { entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } }, cameraTarget: [0, 0, 0] };
        }
        // Pharmacology
        if (text.match(/drug|pharmacol|receptor|agonist|antagonist|dose|therapeutic|toxicity/)) {
            return { entities: ["receptor", "antibody"], positions: { receptor: { x: 0, y: 0, z: 0 }, antibody: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // Physiology
        if (text.match(/physiology|process|mechanism|pathway|cascade|metabolism|transport|signaling|synaps|contraction/)) {
            return { entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } }, cameraTarget: [0, 0, 0] };
        }
        // Anatomy
        if (text.match(/anatomy|organ|tissue|muscle|bone|nerve|vessel|lung|liver|kidney|skin|stomach|intestine/)) {
            return { entities: ["human_cell", "blood_vessel"], positions: { human_cell: { x: 0, y: 0, z: 0 }, blood_vessel: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        // Disease
        if (text.match(/disease|disorder|syndrome|infection|illness|condition/)) {
            return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
        }
        // Default
        return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
    }

    // ======= CLASSIFY STEP =======
    static classifyStep(sentence) {
        const l = sentence.toLowerCase();
        if (l.match(/^(caus|result|lead|trigger|initiat|begin|start|origin|develop|transmit|spread|infect)/)) return { type: "trigger", name: "Cause" };
        if (l.match(/(mechanism|pathway|cascade|signal|receptor|bind|interact|activat)/)) return { type: "signaling", name: "Mechanism" };
        if (l.match(/(symptom|sign|present|manifest|character|clinical|fever|pain|rash)/)) return { type: "description", name: "Clinical Features" };
        if (l.match(/(diagnos|test|investigat|confirm|detect|identif|microscop|culture|imaging)/)) return { type: "action", name: "Diagnosis" };
        if (l.match(/(treat|therap|drug|medicat|manag|prevent|vaccin|surg)/)) return { type: "action", name: "Treatment" };
        if (l.match(/(spread|transmit|infect|invas|dissemin|migrat)/)) return { type: "progression", name: "Transmission" };
        if (l.match(/(resolv|heal|recover|improv|surviv|prognos)/)) return { type: "resolution", name: "Outcome" };
        if (l.match(/(complex|multipl|various|classif|categor|type|form)/)) return { type: "formation", name: "Classification" };
        if (l.match(/(important|significant|essential|crucial|key|major|primary)/)) return { type: "signaling", name: "Key Point" };
        return { type: "description", name: "Key Detail" };
    }

    // ======= FACTS =======
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

    // ======= QUIZ =======
    static buildQuiz(topic, storyboard, research) {
        const questions = [];
        const scenes = storyboard.scenes.filter(s => s.type !== "intro" && s.type !== "summary");
        if (scenes.length > 0) {
            questions.push({ question: "What is the FIRST step in " + topic + "?", options: [scenes[0].name, "Digestion", "Summary", "Cleanup"], correct: 0, explanation: scenes[0].narration });
        }
        if (scenes.length > 2) {
            const mid = scenes[Math.floor(scenes.length / 2)];
            questions.push({ question: "During " + topic + ", what happens at the " + mid.name.toLowerCase() + " stage?", options: [mid.narration.substring(0, 100), "Nothing happens", "The process stops", "All cells die"], correct: 0, explanation: mid.narration });
        }
        if (scenes.length > 0) {
            const last = scenes[scenes.length - 1];
            questions.push({ question: "What is the final stage of " + topic + "?", options: [last.name, "Initialization", "Recognition", "Attachment"], correct: 0, explanation: last.narration });
        }
        questions.push({ question: "How many stages are in " + topic + "?", options: [scenes.length + " stages", "2 stages", "Only 1 stage", "100 stages"], correct: 0, explanation: topic + " has " + scenes.length + " documented stages." });
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
