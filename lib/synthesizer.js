// ============================================
// Synthesizer - Extracts REAL biological process steps
// Not outlines - actual mechanism with cause/effect
// ============================================

class Synthesizer {

    static synthesize(topic, researchData) {
        const facts = this.extractFacts(researchData, topic);
        const wikiSummary = researchData.wikipedia?.summary || "";
        const allText = this.getAllText(researchData, topic);
        const processSteps = this.extractRealSteps(topic, wikiSummary, allText, facts);
        const narration = this.buildNarration(topic, processSteps);
        const quiz = this.buildQuiz(topic, processSteps, researchData);
        const animationSteps = this.buildAnimation(processSteps);

        return {
            topic,
            synthesizedAt: new Date().toISOString(),
            factsFound: facts.length,
            facts,
            processSteps,
            narration,
            quiz,
            animationSteps,
            sources: this.summarizeSources(researchData)
        };
    }

    static extractFacts(research, topic) {
        const facts = [];
        if (research.wikipedia?.summary) {
            research.wikipedia.summary.split(/[.!?]+/).filter(s => s.trim().length > 10).forEach(s => {
                facts.push({ text: s.trim(), source: "Wikipedia", confidence: 0.9 });
            });
        }
        if (research.pubmed?.articles) {
            research.pubmed.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "PubMed", confidence: 0.85 }); });
        }
        if (research.openalex?.articles) {
            research.openalex.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "OpenAlex", confidence: 0.8 }); });
        }
        if (research.crossref?.articles) {
            research.crossref.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "CrossRef", confidence: 0.7 }); });
        }
        if (research.semanticScholar?.articles) {
            research.semanticScholar.articles.forEach(a => { if (a.title) facts.push({ text: a.title, source: "SemanticScholar", confidence: 0.8 }); });
        }
        if (research.duckduckgo?.abstract) {
            research.duckduckgo.abstract.split(/[.!?]+/).filter(s => s.trim().length > 10).forEach(s => {
                facts.push({ text: s.trim(), source: "DuckDuckGo", confidence: 0.75 });
            });
        }
        return this.deduplicate(facts);
    }

    getAllText(research, topic) {
        let text = topic + ". ";
        if (research.wikipedia?.summary) text += research.wikipedia.summary + " ";
        if (research.pubmed?.articles) research.pubmed.articles.forEach(a => { text += (a.title || "") + ". "; });
        if (research.openalex?.articles) research.openalex.articles.forEach(a => { text += (a.title || "") + ". "; });
        if (research.crossref?.articles) research.crossref.articles.forEach(a => { text += (a.title || "") + ". "; });
        if (research.semanticScholar?.articles) research.semanticScholar.articles.forEach(a => { text += (a.title || "") + ". "; });
        if (research.duckduckgo?.abstract) text += research.duckduckgo.abstract + " ";
        return text;
    }

    // ======= THE KEY FUNCTION: Extract real biological process steps =======
    static extractRealSteps(topic, wikiSummary, allText, facts) {
        const steps = [];
        const topicLower = topic.toLowerCase();

        // Step 1: Try to extract process from Wikipedia summary
        if (wikiSummary) {
            const sentences = wikiSummary.split(/[.!?]+/).filter(s => s.trim().length > 8);
            sentences.forEach((s, i) => {
                const clean = s.trim();
                if (clean.length > 10) {
                    steps.push({
                        step: i + 1,
                        name: this.nameStep(clean, topic),
                        description: clean,
                        type: this.classifyStep(clean)
                    });
                }
            });
        }

        // Step 2: Search research titles for additional process information
        if (steps.length < 3) {
            const relevantFacts = facts.filter(f =>
                f.source !== "Topic" && f.text.length > 15
            ).slice(0, 5);
            relevantFacts.forEach((fact, i) => {
                const existing = steps.find(s => s.description.substring(0, 40) === fact.text.substring(0, 40));
                if (!existing) {
                    steps.push({
                        step: steps.length + 1,
                        name: this.nameStep(fact.text, topic),
                        description: fact.text,
                        type: this.classifyStep(fact.text)
                    });
                }
            });
        }

        // Step 3: Generate process steps from topic knowledge if we don't have enough
        if (steps.length < 3) {
            const generated = this.generateProcessFromTopic(topic, allText);
            generated.forEach(g => {
                if (!steps.find(s => s.description.substring(0, 30) === g.description.substring(0, 30))) {
                    steps.push({ step: steps.length + 1, ...g });
                }
            });
        }

        // Ensure at least 4 steps, at most 10
        if (steps.length < 4) {
            steps.push({
                step: steps.length + 1,
                name: "Summary",
                description: topic + " involves " + steps.length + " key processes documented across " + facts.length + " research findings.",
                type: "summary"
            });
        }

        return steps.slice(0, 10);
    }

    // Generate realistic process steps by analyzing topic keywords
    static generateProcessFromTopic(topic, allText) {
        const steps = [];
        const lower = topic.toLowerCase();
        const textLower = allText.toLowerCase();

        // Build process based on medical keyword detection
        const processMap = {
            // Infection/Pathogen processes
            "pathogen": { trigger: "Pathogen enters the body", response: "Innate immune system detects pathogen", signal: "Pattern recognition receptors activated", immune: "Inflammatory cytokines released", cells: "Neutrophils and macrophages recruited", action: "Phagocytosis and pathogen killing", outcome: "Pathogen cleared or chronic infection develops" },
            "infection": { trigger: "Pathogen exposure occurs", response: "Physical barriers breached", signal: "DAMPs and PAMPs detected", immune: "Complement system activated", cells: "Inflammatory cells recruited to site", action: "Engulfment and destruction of pathogen", outcome: "Resolution or spread of infection" },
            "bacteria": { trigger: "Bacteria adhere to host tissue", response: "Adhesins bind to host receptors", signal: "Biofilm formation may begin", immune: "Host immune response initiated", cells: "Phagocytes engulf bacteria", action: "Intracellular killing mechanisms activated", outcome: "Bacteria eliminated or persist" },
            "virus": { trigger: "Virus binds to host cell receptor", response: "Viral entry into host cell", signal: "Viral replication machinery hijacked", immune: "Interferon response triggered", cells: "Cytotoxic T cells and NK cells activated", action: "Infected cells destroyed", outcome: "Virus cleared or latent infection established" },
            "immune": { trigger: "Antigen detected by immune system", response: "Antigen presentation by APCs", signal: "T cell activation and differentiation", immune: "Effector immune response mounted", cells: "B cells produce antibodies, T cells attack", action: "Targeted destruction of threat", outcome: "Immunological memory established" },
            "phagocytosis": { trigger: "Pathogen detected by phagocyte", response: "Chemotactic factors attract macrophage", signal: "Receptor-ligand binding on pathogen surface", immune: "Macrophage extends pseudopods", action: "Pathogen engulfed into phagosome", outcome: "Phagolysosome fusion and pathogen destruction by ROS and enzymes" },
            "inflammation": { trigger: "Tissue damage or infection detected", response: "Mast cells release histamine", signal: "Vasodilation and increased permeability", immune: "Neutrophils extravasate from blood vessels", cells: "Macrophages arrive for cleanup", action: "Phagocytosis of debris and pathogens", outcome: "Tissue repair and resolution of inflammation" },
            "apoptosis": { trigger: "Cell damage or death signal received", response: "Intrinsic or extrinsic pathway activated", signal: "Caspase cascade initiated", immune: "Apoptotic bodies formed", cells: "Neighboring phagocytes recognize and engulf", action: "Efferocytosis clears dead cells", outcome: "Tissue homeostasis maintained without inflammation" },
            "diabetes": { trigger: "Blood glucose dysregulation", response: "Insulin production or sensitivity impaired", signal: "Hyperglycemia damages tissues", immune: "Chronic low-grade inflammation", cells: "Pancreatic beta cells stressed", action: "Metabolic pathways disrupted", outcome: "Organ damage and complications" },
            "cancer": { trigger: "Mutations accumulate in cell DNA", response: "Uncontrolled cell proliferation", signal: "Growth signals constitutively activated", immune: "Tumor immune evasion mechanisms", cells: "Tumor microenvironment established", action: "Angiogenesis and invasion", outcome: "Metastasis or immune-mediated destruction" },
            "tb": { trigger: "M. tuberculosis inhaled into lungs", response: "Alveolar macrophages engulf bacteria", signal: "Granuloma formation initiated", immune: "T cells activated around granuloma", cells: "Macrophages fuse into giant cells", action: "Bacteria survive inside macrophages", outcome: "Latent infection or active TB disease" },
            "tuberculosis": { trigger: "M. tuberculosis inhaled into lungs", response: "Alveolar macrophages engulf bacteria", signal: "Granuloma formation initiated", immune: "T cells activated around granuloma", cells: "Macrophages fuse into giant cells", action: "Bacteria survive inside macrophages", outcome: "Latent infection or active TB disease" },
            "malaria": { trigger: "Plasmodium sporozoites enter bloodstream", response: "Sporozoites travel to liver", signal: "Hepatocyte infection and multiplication", immune: "Merozoites released into blood", cells: "Red blood cells infected cyclically", action: "Hemoglobin destroyed, hemozoin released", outcome: "Fever cycles, anemia, organ damage" },
            "neuron": { trigger: "Electrical signal generated at axon hillock", response: "Action potential propagates along axon", signal: "Voltage-gated channels open sequentially", immune: "Synaptic vesicles fuse at terminal", cells: "Neurotransmitter binds postsynaptic receptor", action: "Signal transmitted to next neuron", outcome: "Neural circuit activated" },
            "heart": { trigger: "SA node generates electrical impulse", response: "Atria depolarize and contract", signal: "AV node delays signal briefly", immune: "Bundle of His conducts signal", cells: "Ventricles depolarize and contract", action: "Blood pumped through pulmonary and systemic circuits", outcome: "Complete cardiac cycle" },
            "kidney": { trigger: "Blood enters glomerulus under pressure", response: "Filtration through glomerular membrane", signal: "Filtrate enters Bowman's capsule", immune: "Tubular reabsorption of useful substances", cells: "Secretion of waste products into tubule", action: "Concentrated urine formed", outcome: "Waste excreted, homeostasis maintained" },
            "surgery": { trigger: "Patient prepared and anesthesia administered", response: "Surgical site accessed", signal: "Target tissue identified and treated", immune: "Wound closure begins", cells: "Healing and recovery processes", action: "Post-operative care and monitoring", outcome: "Recovery and rehabilitation" },
            "drug": { trigger: "Drug administered to patient", response: "Drug absorbed into bloodstream", signal: "Distribution to target tissues", immune: "Drug-receptor interaction at target site", cells: "Therapeutic effect produced", action: "Metabolism and elimination", outcome: "Clinical response achieved" },
            "metabolism": { trigger: "Nutrients enter cells", response: "Catabolic pathways break down molecules", signal: "ATP and energy produced", immune: "Anabolic pathways build needed molecules", cells: "Metabolic intermediates processed", action: "Waste products eliminated", outcome: "Cellular energy and building blocks supplied" },
            "protein": { trigger: "DNA transcribed to mRNA", response: "mRNA processed and exported", signal: "Ribosome translates mRNA", immune: "tRNA delivers amino acids", cells: "Polypeptide chain folds into protein", action: "Post-translational modifications", outcome: "Functional protein delivered to target" },
            "enzyme": { trigger: "Substrate binds to enzyme active site", response: "Enzyme-substrate complex forms", signal: "Catalytic residues lower activation energy", immune: "Product released from active site", cells: "Enzyme recycled for next reaction", action: "Reaction rate increased dramatically", outcome: "Biochemical process completed efficiently" },
            "membrane": { trigger: "Molecule approaches cell membrane", response: "Lipid bilayer acts as barrier", signal: "Transport proteins or channels activated", immune: "Selective permeability maintained", cells: "Molecule transported across membrane", action: "Intracellular concentration regulated", outcome: "Cellular homeostasis maintained" },
            "receptor": { trigger: "Ligand approaches receptor", response: "Ligand binds to receptor site", signal: "Conformational change in receptor", immune: "Intracellular signaling cascade activated", cells: "Second messengers generated", action: "Cellular response initiated", outcome: "Physiological effect produced" },
            "inflammation": { trigger: "Tissue damage detected", response: "Inflammatory mediators released", signal: "Blood vessels dilate", immune: "Immune cells recruited to site", cells: "Phagocytosis of debris", action: "Tissue repair begins", outcome: "Inflammation resolved or chronic" },
            "syndrome": { trigger: "Multiple symptoms cluster together", response: "Clinical pattern recognized", signal: "Underlying mechanism investigated", immune: "Diagnosis confirmed by criteria", cells: "Pathophysiology understood", action: "Targeted treatment initiated", outcome: "Patient outcomes improved" }
        };

        // Find matching process template
        let template = null;
        for (const [key, proc] of Object.entries(processMap)) {
            if (lower.includes(key) || textLower.includes(key)) {
                template = proc;
                break;
            }
        }

        if (template) {
            steps.push({ name: "Trigger", description: template.trigger + " - This is the initial event that starts the process of " + topic + ".", type: "trigger" });
            steps.push({ name: "Recognition", description: template.response + " - The body recognizes the change and begins its response.", type: "recognition" });
            steps.push({ name: "Signaling", description: template.signal + " - Chemical signals coordinate the cellular response.", type: "signaling" });
            steps.push({ name: "Immune Response", description: template.immune + " - The immune system mounts its defense.", type: "immune" });
            steps.push({ name: "Cellular Action", description: template.action + " - Targeted cells carry out their function to address the problem.", type: "action" });
            steps.push({ name: "Outcome", description: template.outcome + " - The final result determines the clinical outcome.", type: "outcome" });
        } else {
            // Generic but still process-oriented
            steps.push({ name: "Initiation", description: topic + " begins when the initial stimulus is detected by the body.", type: "trigger" });
            steps.push({ name: "Recognition", description: "Receptors and sensors identify the specific nature of the stimulus.", type: "recognition" });
            steps.push({ name: "Response", description: "Cellular mechanisms are activated to respond to " + topic + ".", type: "response" });
            steps.push({ name: "Regulation", description: "Feedback mechanisms control the intensity and duration of the response.", type: "regulation" });
            steps.push({ name: "Resolution", description: "The process reaches its conclusion, restoring balance or establishing a new state.", type: "outcome" });
        }

        return steps;
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
        if (lower.match(/regulat|control|modulat/)) return "Regulation";
        if (lower.match(/spread|dissem|metastas|invas/)) return "Spread";
        if (lower.match(/memory|learn|adap/)) return "Memory";
        if (lower.match(/die|death|necros|apopt/)) return "Cell Death";
        if (lower.match(/develop|grow|form|structur/)) return "Development";
        if (lower.match(/is a|are the|refers to|defined/)) return "Definition";
        if (lower.match(/cause|lead|result|responsible/)) return "Cause";
        return "Step";
    }

    static classifyStep(sentence) {
        const lower = sentence.toLowerCase();
        if (lower.match(/first|initial|begin|start|trigger|cause/)) return "trigger";
        if (lower.match(/detect|recogni|identif|bind/)) return "recognition";
        if (lower.match(/signal|activat|stimulat/)) return "signaling";
        if (lower.match(/releas|secrete|produc|synth/)) return "action";
        if (lower.match(/engulf|phagocyt|internali|kill|destroy|digest/)) return "action";
        if (lower.match(/spread|dissem|infect|invas/)) return "progression";
        if (lower.match(/repair|heal|resolv|restor|recover/)) return "resolution";
        if (lower.match(/is a|are|refers to|definition/)) return "definition";
        return "description";
    }

    static buildNarration(topic, steps) {
        const narration = [];

        narration.push({
            time: 0,
            text: "Let us explore the process of " + topic + ". I will walk you through each step of this mechanism."
        });

        let time = 2;
        steps.forEach((step, i) => {
            narration.push({
                time: time,
                text: "Step " + (i + 1) + ": " + step.name + ". " + step.description
            });
            time += 4;
        });

        narration.push({
            time: time,
            text: "This concludes our walkthrough of " + topic + ". You have learned " + steps.length + " key steps in this process."
        });

        return narration;
    }

    static buildQuiz(topic, steps, research) {
        const questions = [];

        // Question about first step
        if (steps.length > 1) {
            const wrongSteps = ["Digestion", "Sleep", "Photosynthesis", "Evaporation"];
            questions.push({
                question: "What is the FIRST step in " + topic + "?",
                options: [steps[0].description.substring(0, 80) + "...", wrongSteps[0], wrongSteps[1], wrongSteps[2]],
                correct: 0,
                explanation: "The process begins with: " + steps[0].description
            });
        }

        // Question about specific step
        if (steps.length > 3) {
            const midStep = steps[Math.floor(steps.length / 2)];
            questions.push({
                question: "During " + topic + ", what happens during the " + midStep.name.toLowerCase() + " phase?",
                options: [
                    midStep.description.substring(0, 80) + "...",
                    "The process completely stops",
                    "Nothing happens at this stage",
                    "All cells die immediately"
                ],
                correct: 0,
                explanation: midStep.description
            });
        }

        // Question about outcome
        if (steps.length > 0) {
            const lastStep = steps[steps.length - 1];
            questions.push({
                question: "What is the final outcome of " + topic + "?",
                options: [
                    lastStep.description.substring(0, 80) + "...",
                    "Nothing happens",
                    "The process reverses completely",
                    "All cells disappear"
                ],
                correct: 0,
                explanation: lastStep.description
            });
        }

        // Question about total steps
        questions.push({
            question: "How many key steps are involved in " + topic + "?",
            options: [
                steps.length + " distinct steps",
                "Only 1 step",
                "Exactly 100 steps",
                "No defined steps"
            ],
            correct: 0,
            explanation: topic + " involves " + steps.length + " documented steps in its process."
        });

        return questions.slice(0, 6);
    }

    static buildAnimation(steps) {
        const effects = [
            "doctor_explain", "doctor_point_bacterium", "doctor_write",
            "doctor_point_macrophage", "glow_macrophage", "doctor_explain",
            "doctor_write", "doctor_point_bacterium", "glow_macrophage",
            "doctor_point_macrophage"
        ];

        return steps.map((step, i) => ({
            name: step.name,
            duration: 4,
            description: step.description,
            effect: effects[i % effects.length],
            camera: {
                distance: 20 - (i * 0.8),
                angle: i * 0.5
            }
        }));
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
        if (research.pubmed?.count > 0) sources.push("PubMed: " + research.pubmed.count + " articles");
        if (research.openalex?.count > 0) sources.push("OpenAlex: " + research.openalex.count + " articles");
        if (research.crossref?.count > 0) sources.push("CrossRef: " + research.crossref.count + " articles");
        if (research.semanticScholar?.count > 0) sources.push("SemanticScholar: " + research.semanticScholar.count + " articles");
        if (research.wikipedia) sources.push("Wikipedia: " + research.wikipedia.title);
        if (research.googleScholar?.count > 0) sources.push("GoogleScholar: " + research.googleScholar.count + " results");
        return sources;
    }
}

module.exports = Synthesizer;
