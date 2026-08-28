const Synthesizer = class {
    static synthesize(topic, researchData) {
        const wikiSummary = researchData.wikipedia?.summary || "";
        const allText = researchData.allResults?.map(r => r.snippet).join(" ") || "";
        const facts = [];
        if (researchData.wikipedia?.summary) facts.push(researchData.wikipedia.summary);
        researchData.allResults?.forEach(r => { if (r.snippet) facts.push(r.snippet); });
        const storyboard = Synthesizer.buildFromResearch(topic, wikiSummary, allText, facts, researchData);
        return { topic, storyboard, researchSources: researchData.allResults?.length || 0, timestamp: new Date().toISOString() };
    }

    static buildFromResearch(topic, wikiSummary, allText, facts, researchData) {
        const scenes = [];
        const allResults = researchData.allResults || [];

        // Extract sentences from ALL results
        const allSentences = [];
        allResults.forEach(r => {
            if (!r.snippet) return;
            const sents = r.snippet.split(/(?<=[.!?])\s+/);
            sents.forEach(s => {
                const t = s.trim();
                if (t.length < 25) return;
                if (t.match(/^\d{4}\s/)) return;
                if (t.match(/\(\d{4}\)/)) return;
                if (t.match(/doi:|pmid:|pubmed|http|www\./i)) return;
                if (t.match(/^[A-Z][a-z]+, [A-Z]/)) return;
                if (t.match(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/)) return;
                if (t.match(/^[A-Z][a-záéíóú]+ [A-Z][a-záéíóú]+, [A-Z]/)) return;
                if (t.match(/,\s*[A-Z][a-z]+\s[A-Z][a-z]+/)) return;
                if (t.match(/^[A-Z][a-z]+ [A-Z]\.\s[A-Z]/)) return;
                if (t.match(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z]\./)) return;
                if (t.match(/^[A-Z][a-záéíóú]+ [A-Z][a-záéíóú]+ [A-Z][a-záéíóú]+$/)) return;
                if (t.match(/^[A-Z][a-z]+ [A-Z][a-z]+-[A-Z][a-z]+/)) return;
                if (t.length < 40 && t.match(/^[A-Z]/) && !t.match(/\b(is|are|was|were|has|have|can|may|will|causes|leads|results|occurs|develops|includes|contains|involves|affects|presents|manifests|diagnosed|treated|begins|starts|spreads|infects|kills|prevents|improves|reduces|increases|decreases|causes)\b/)) return;
                allSentences.push({ text: t, source: r.source, title: r.title });
            });
        });

        // Deduplicate
        const seen = new Set();
        const uniqueSentences = [];
        allSentences.forEach(s => {
            const key = s.text.toLowerCase().substring(0, 40);
            if (!seen.has(key)) { seen.add(key); uniqueSentences.push(s); }
        });

        const topicType = Synthesizer.getTopicType(topic, wikiSummary);
        const effects = Synthesizer.getEffectsForTopic(topicType.entities);

        // Scene 1: Best overview from Wikipedia or first result
        const introSentence = wikiSummary.split(/(?<=[.!?])\s+/)[0] || uniqueSentences[0]?.text || topic + " is an important medical topic.";

        scenes.push({
            step: 1, name: "Introduction", label: topic, type: "intro",
            narration: introSentence,
            duration: Math.min(8, Math.max(4, Math.ceil(introSentence.split(" ").length / 12))),
            entities: topicType.entities, positions: topicType.positions,
            camera: { distance: 22, angle: 0.3, target: topicType.cameraTarget },
            labels: [{ text: topic, position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: effects[0]
        });

        // Remove sentences that are too similar to intro
        const introKey = introSentence.toLowerCase().substring(0, 40);
        const filteredSentences = uniqueSentences.filter(s => {
            const key = s.text.toLowerCase().substring(0, 40);
            return key !== introKey && !s.text.startsWith(introSentence.substring(0, 30));
        });

        // Scenes 2-N: Use as many good sentences as possible (up to 10)
        const contentForScenes = filteredSentences.slice(0, 10);
        const cameraAngles = [0.5, 0.8, 1.2, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5];
        const cameraDists = [16, 14, 12, 14, 16, 18, 14, 12, 14, 16];

        contentForScenes.forEach((sentence, i) => {
            const stepType = Synthesizer.classifyStep(sentence.text);
            const dur = Math.min(7, Math.max(4, Math.ceil(sentence.text.split(" ").length / 13)));
            scenes.push({
                step: i + 2, name: stepType.name, label: (i + 2) + ". " + stepType.name,
                type: stepType.type, narration: sentence.text, duration: dur,
                entities: topicType.entities, positions: topicType.positions,
                camera: { distance: cameraDists[i % cameraDists.length], angle: cameraAngles[i % cameraAngles.length], target: [0, 0, 0] },
                labels: [{ text: sentence.source || stepType.name, position: [0, 2.5, 0], offset: [0, 0, 0] }],
                effect: effects[(i + 1) % effects.length]
            });
        });

        // Summary: use last unique sentence if available
        if (uniqueSentences.length > 10) {
            const lastSentence = uniqueSentences[uniqueSentences.length - 1].text;
            scenes.push({
                step: scenes.length + 1, name: "Summary", label: topic + " — Complete", type: "summary",
                narration: lastSentence,
                duration: 5, entities: topicType.entities, positions: topicType.positions,
                camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
                labels: [{ text: topic + " — Summary", position: [0, 3, 0], offset: [0, 0, 0] }],
                effect: effects[0]
            });
        }

        return { topic, stages: scenes.length, scenes };
    }

    static getEffectsForTopic(entities) {
        const hasMacrophage = entities.includes("macrophage");
        const hasBacterium = entities.includes("bacterium");
        const hasVirus = entities.includes("virus");
        const hasNeuron = entities.includes("neuron");
        const hasBrain = entities.includes("brain");
        const hasHeart = entities.includes("heart");
        const hasDNA = entities.includes("dna");
        const hasCancer = entities.includes("cancer_cell");
        const hasRBC = entities.includes("red_blood_cell");

        if (hasMacrophage && hasBacterium) {
            return ["doctor_explain", "bacterium_swim", "macrophage_patrol", "extend_pseudopods", "doctor_point_bacterium", "glow_macrophage", "engulf", "form_phagosome", "fuse_lysosomes", "destroy"];
        }
        if (hasVirus) {
            return ["doctor_explain", "glow_macrophage", "doctor_write", "doctor_point_bacterium", "glow_macrophage", "doctor_explain", "glow_macrophage", "doctor_write", "doctor_point_bacterium", "doctor_explain"];
        }
        if (hasBrain || hasNeuron) {
            return ["doctor_explain", "highlight_nucleus", "doctor_write", "highlight_mitochondria", "doctor_point_macrophage", "doctor_explain", "highlight_nucleus", "highlight_lysosomes", "doctor_write", "doctor_explain"];
        }
        if (hasHeart || hasRBC) {
            return ["doctor_explain", "glow_macrophage", "doctor_point_bacterium", "glow_macrophage", "doctor_write", "doctor_explain", "glow_macrophage", "doctor_point_bacterium", "glow_macrophage", "doctor_explain"];
        }
        if (hasDNA) {
            return ["doctor_explain", "highlight_nucleus", "doctor_write", "highlight_mitochondria", "doctor_explain", "highlight_nucleus", "doctor_write", "highlight_lysosomes", "doctor_explain", "highlight_nucleus"];
        }
        if (hasCancer) {
            return ["doctor_explain", "glow_macrophage", "doctor_point_bacterium", "glow_macrophage", "doctor_write", "doctor_explain", "glow_macrophage", "doctor_point_bacterium", "doctor_write", "doctor_explain"];
        }
        return ["doctor_explain", "glow_macrophage", "doctor_write", "doctor_point_bacterium", "extend_pseudopods", "doctor_explain", "glow_macrophage", "doctor_write", "doctor_point_bacterium", "doctor_explain"];
    }

    static getTopicType(topic, wikiSummary) {
        const text = (wikiSummary + " " + topic).toLowerCase();

        if (text.match(/parasit|worm|larva|tapeworm|helminth|cestode|nematode|fluke|schistosom|taenia|echinococc|trichinell|hookworm|roundworm|cysticerc|malaria|plasmodium|amoeb|protozo/)) {
            return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
        }
        if (text.match(/bacteri|microbe|staphylococc|streptococc|salmonell|tubercul|pneumococc|meningococc|clostrid|bacillus|vibrio|chlamyd|mycoplasm|legionell|borrelia|treponema|leptospira|brucell|listeria|corynebacterium|mycobacterium/)) {
            return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
        }
        if (text.match(/virus|viral|influenza|coronavirus|covid|hiv|aids|hepatitis|herpes|ebola|zika|dengue|measles|rubella|rabies|rotavirus|papillomavirus/)) {
            return { entities: ["virus", "lymphocyte"], positions: { virus: { x: 0, y: 0, z: 0 }, lymphocyte: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/brain|neurolog|neuro|cerebr|cerebell|cortex|hippocampus|synaps|neurotransmit|alzheimer|parkinson|epilep|seizure|stroke|mening|encephal|dementia|neuropath/)) {
            return { entities: ["brain", "neuron"], positions: { brain: { x: 0, y: 0, z: 0 }, neuron: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/heart|cardiac|cardiol|myocard|endocard|pericard|arrhythm|coronary|angina|infarction|heart failure|valv|atrial|ventricul|aorta|blood pressure|hypertension/)) {
            return { entities: ["heart", "red_blood_cell"], positions: { heart: { x: 0, y: 0, z: 0 }, red_blood_cell: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/blood|hematol|hemoglobin|erythrocyte|leukocyte|thrombocyte|platelet|anemia|leukemia|lymphoma|myeloma|coagul|sickle|thalass|reticulocyte/)) {
            return { entities: ["red_blood_cell", "neutrophil"], positions: { red_blood_cell: { x: 0, y: 0, z: 0 }, neutrophil: { x: 4, y: 1, z: 0 } }, cameraTarget: [2, 0.5, 0] };
        }
        if (text.match(/cancer|carcinoma|sarcoma|leukemia|lymphoma|melanoma|glioma|tumor|oncolog|metasta|neoplasm|benign|malignant|chemotherapy|radiation/)) {
            return { entities: ["cancer_cell", "lymphocyte"], positions: { cancer_cell: { x: 0, y: 0, z: 0 }, lymphocyte: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/dna|gene|genetic|chromosome|genome|mutation|heredit|allele|genotype|phenotype|replication|transcription|translation|rna|mrna|trna|rrna|exon|intron|promoter|enhancer/)) {
            return { entities: ["dna", "receptor"], positions: { dna: { x: 0, y: 0, z: 0 }, receptor: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/immun|antibod|antigen|complement|vaccine|immuniz|autoimmun|immunodefici|allerg|hypersensit|transplant|graft/)) {
            return { entities: ["antibody", "macrophage"], positions: { antibody: { x: 0, y: 1, z: 0 }, macrophage: { x: 0, y: -1, z: 0 } }, cameraTarget: [0, 0, 0] };
        }
        if (text.match(/cell|organelle|mitochondri|ribosome|endoplasmic|golgi|lysosome|nucleus|membrane|cytoplasm|chromosome|protein|enzyme/)) {
            return { entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } }, cameraTarget: [0, 0, 0] };
        }
        if (text.match(/drug|pharmacol|receptor|agonist|antagonist|dose|therapeutic|toxicity/)) {
            return { entities: ["receptor", "antibody"], positions: { receptor: { x: 0, y: 0, z: 0 }, antibody: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/physiology|process|mechanism|pathway|cascade|metabolism|transport|signaling|synaps|contraction/)) {
            return { entities: ["human_cell"], positions: { human_cell: { x: 0, y: 0, z: 0 } }, cameraTarget: [0, 0, 0] };
        }
        if (text.match(/anatomy|organ|tissue|muscle|bone|nerve|vessel|lung|liver|kidney|skin|stomach|intestine/)) {
            return { entities: ["human_cell", "blood_vessel"], positions: { human_cell: { x: 0, y: 0, z: 0 }, blood_vessel: { x: 5, y: 0, z: 0 } }, cameraTarget: [2.5, 0, 0] };
        }
        if (text.match(/disease|disorder|syndrome|infection|illness|condition/)) {
            return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
        }
        return { entities: ["macrophage", "bacterium"], positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } }, cameraTarget: [3, 0, 0] };
    }

    static classifyStep(sentence) {
        const l = sentence.toLowerCase();
        if (l.match(/^(caus|result|lead|trigger|initiat|begin|start|origin|develop|transmit|spread|infect)/)) return { type: "trigger", name: "Cause" };
        if (l.match(/(mechanism|pathway|cascade|signal|receptor|bind|interact|activat)/)) return { type: "signaling", name: "Mechanism" };
        if (l.match(/(symptom|sign|present|manifest|character|clinical|fever|pain|rash|headache|nausea|fatigue|weakness)/)) return { type: "description", name: "Clinical Features" };
        if (l.match(/(diagnos|test|investigat|confirm|detect|identif|microscop|culture|imaging|x.?ray|mri|ct scan)/)) return { type: "action", name: "Diagnosis" };
        if (l.match(/(treat|therap|drug|medicat|manag|prevent|vaccin|surg|antibiotic|surgery|chemotherapy)/)) return { type: "action", name: "Treatment" };
        if (l.match(/(spread|transmit|infect|invas|dissemin|migrat|bite|contact|airborne)/)) return { type: "progression", name: "Transmission" };
        if (l.match(/(resolv|heal|recover|improv|surviv|prognos|mortality|death|fatal)/)) return { type: "resolution", name: "Outcome" };
        if (l.match(/(complex|multipl|various|classif|categor|type|form|stage|grade)/)) return { type: "formation", name: "Classification" };
        if (l.match(/(important|significant|essential|crucial|key|major|primary|common|most)/)) return { type: "signaling", name: "Key Point" };
        if (l.match(/(prevalen|incidence|epidemiolog|risk|factor|populat|country|region)/)) return { type: "description", name: "Epidemiology" };
        if (l.match(/(anatomy|structur|organ|tissue|location|position|area|region)/)) return { type: "description", name: "Anatomy" };
        if (l.match(/(function|role|process|mechanism|pathway|how|work)/)) return { type: "signaling", name: "Function" };
        return { type: "description", name: "Key Detail" };
    }
};

module.exports = Synthesizer;
