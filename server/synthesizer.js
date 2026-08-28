// ============================================
// AI Data Synthesizer - FREE, Local Processing
// Reads research data, generates narration + quiz
// No API keys, no cloud, runs on server
// ============================================

class Synthesizer {

    // Synthesize research data into structured narration
    static synthesize(topic, researchData) {
        const facts = this.extractFacts(researchData);
        const processSteps = this.extractProcessSteps(facts, topic);
        const narration = this.generateNarration(topic, facts, processSteps);
        const quiz = this.generateQuiz(topic, facts);
        const animationSteps = this.buildAnimationSteps(processSteps);

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

    // Extract medical facts from all research sources
    static extractFacts(research) {
        const facts = [];

        // From Wikipedia
        if (research.wikipedia?.summary) {
            const sentences = research.wikipedia.summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
            sentences.forEach(s => {
                const clean = s.trim();
                if (this.isMedicalFact(clean)) {
                    facts.push({ text: clean, source: "Wikipedia", confidence: 0.8 });
                }
            });
        }

        // From PubMed abstracts
        if (research.pubmed?.articles) {
            research.pubmed.articles.forEach(article => {
                if (article.abstract) {
                    const sentences = article.abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
                    sentences.forEach(s => {
                        const clean = s.trim();
                        if (this.isMedicalFact(clean)) {
                            facts.push({ text: clean, source: "PubMed", confidence: 0.95, pmid: article.pmid });
                        }
                    });
                }
            });
        }

        // From Semantic Scholar
        if (research.semanticScholar?.articles) {
            research.semanticScholar.articles.forEach(article => {
                if (article.abstract) {
                    const sentences = article.abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
                    sentences.forEach(s => {
                        const clean = s.trim();
                        if (this.isMedicalFact(clean)) {
                            facts.push({ text: clean, source: "SemanticScholar", confidence: 0.9 });
                        }
                    });
                }
            });
        }

        // From DuckDuckGo
        if (research.duckduckgo?.abstract) {
            const sentences = research.duckduckgo.abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
            sentences.forEach(s => {
                const clean = s.trim();
                if (this.isMedicalFact(clean)) {
                    facts.push({ text: clean, source: "DuckDuckGo", confidence: 0.75 });
                }
            });
        }

        // Deduplicate similar facts
        return this.deduplicateFacts(facts);
    }

    // Check if a sentence is a medical fact (not filler)
    static isMedicalFact(sentence) {
        const medicalKeywords = [
            "cell", "bacteria", "virus", "immune", "antibody", "protein", "enzyme",
            "receptor", "membrane", "nucleus", "mitochondria", "dna", "rna",
            "infection", "disease", "pathogen", "phagocytosis", "inflammation",
            "antigen", "lymphocyte", "t cell", "b cell", "macrophage", "neutrophil",
            "plasma", "serum", "tissue", "organ", "system", "process", "mechanism",
            "synthesis", "metabolism", "transport", "signaling", "pathway",
            "diagnosis", "treatment", "symptom", "syndrome", "disorder",
            "acid", "base", "ph", "oxygen", "carbon dioxide", "glucose",
            "protein", "lipid", "carbohydrate", "vitamin", "mineral",
            "heart", "brain", "lung", "liver", "kidney", "stomach",
            "blood", "plasma", "serum", "tissue", "bone", "muscle",
            "nerve", "neuron", "synapse", "hormone", "insulin",
            "tb", "tuberculosis", "malaria", "hiv", "aids", "cancer",
            "diabetes", "hypertension", "asthma", "pneumonia"
        ];

        const lower = sentence.toLowerCase();
        const wordCount = sentence.split(" ").length;

        // Must be reasonable length
        if (wordCount < 5 || wordCount > 60) return false;

        // Must contain at least one medical keyword
        return medicalKeywords.some(kw => lower.includes(kw));
    }

    // Remove duplicate/similar facts
    static deduplicateFacts(facts) {
        const unique = [];
        const seen = new Set();

        for (const fact of facts) {
            const key = fact.text.toLowerCase().substring(0, 50);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(fact);
            }
        }

        // Sort by confidence
        return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 30);
    }

    // Extract process steps from facts
    static extractProcessSteps(facts, topic) {
        const steps = [];
        const topicLower = topic.toLowerCase();

        // Common process patterns
        const processPatterns = [
            { pattern: /first|initial|begin|start|initiate/i, step: "initiation" },
            { pattern: /recogni[zs]e|detect|identify|bind|attach/i, step: "recognition" },
            { pattern: /activat|stimulat|trigger|induc/i, step: "activation" },
            { pattern: /signal|communicat|transmit|rel/i, step: "signaling" },
            { pattern: /synthesi[sz]|produc|generat|creat/i, step: "synthesis" },
            { pattern: /transport|move|travel|transloc/i, step: "transport" },
            { pattern: /releas|secrete|discharg|emitt/i, step: "release" },
            { pattern: /engulf|phagocyt|internali[sz]|uptak/i, step: "engulfment" },
            { pattern: /digest|degrad|break|destroy|kill|ly/i, step: "destruction" },
            { pattern: /fus|merg|combin|join/i, step: "fusion" },
            { pattern: /divid|proliferat|replicat|multipi/i, step: "proliferation" },
            { pattern: /differentiat|speciali[sz]|transform|convert/i, step: "differentiation" },
            { pattern: /migrat|chemo|attract|recruit/i, step: "migration" },
            { pattern: /inhibit|block|suppress|prevent|stopp/i, step: "inhibition" },
            { pattern: /damag|harm|lesion|necrosis|apoptosi/i, step: "damage" },
            { pattern: /repair|heal|recover|restor/i, step: "repair" },
            { pattern: /regulat|control|modulat|adjust/i, step: "regulation" }
        ];

        for (const fact of facts) {
            for (const { pattern, step } of processPatterns) {
                if (pattern.test(fact.text) && !steps.find(s => s.name === step)) {
                    steps.push({
                        name: step,
                        description: fact.text,
                        source: fact.source
                    });
                }
            }
        }

        // If no steps found, create generic ones
        if (steps.length === 0) {
            steps.push(
                { name: "overview", description: `${topic} is an important medical concept.`, source: "default" },
                { name: "mechanism", description: `The mechanism involves multiple molecular interactions.`, source: "default" },
                { name: "significance", description: `Understanding ${topic} is essential for medical practice.`, source: "default" }
            );
        }

        return steps.slice(0, 8); // Max 8 steps
    }

    // Generate narration text
    static generateNarration(topic, facts, steps) {
        const narration = [];

        // Introduction
        narration.push({
            time: 0,
            text: `Let us explore ${topic}. I will guide you through this important medical concept.`
        });

        // For each process step
        let time = 2;
        for (const step of steps) {
            narration.push({
                time: time,
                text: this.stepToNarration(step, topic)
            });
            time += 2.5;
        }

        // Conclusion
        narration.push({
            time: time,
            text: `This concludes our lesson on ${topic}. Remember the key steps we discussed.`
        });

        return narration;
    }

    // Convert a step to natural narration
    static stepToNarration(step, topic) {
        const stepDescriptions = {
            initiation: `The process begins with ${topic}. Initial triggers set the cascade in motion.`,
            recognition: `Key molecules recognize and identify the target. This recognition step is critical for specificity.`,
            activation: `Once recognized, the pathway is activated. Multiple downstream signals are triggered.`,
            signaling: `Cell-to-cell communication occurs through chemical signals. This coordination ensures an effective response.`,
            synthesis: `New molecules are synthesized. The cell produces the necessary components for the response.`,
            transport: `Molecules are transported to their target locations. This ensures the right components reach the right place.`,
            release: `Active molecules are released into the extracellular space. This amplifies the response.`,
            engulfment: `The target is engulfed into a membrane-bound vesicle. This internalization allows processing.`,
            destruction: `The engulfed material is destroyed by enzymes and chemical processes.`,
            fusion: `Membrane-bound organelles fuse together. This combines their contents for processing.`,
            proliferation: `Cells divide and multiply. This amplifies the immune or cellular response.`,
            differentiation: `Cells specialize and take on specific functions. Each type has a unique role.`,
            migration: `Cells move toward the site of action. Chemical gradients guide their movement.`,
            inhibition: `Regulatory mechanisms prevent excessive activity. This prevents damage to healthy tissue.`,
            damage: `The process causes some degree of tissue damage. This is often a necessary side effect.`,
            repair: `Repair mechanisms restore tissue function. Healing begins once the threat is addressed.`,
            regulation: `Multiple regulatory pathways control the process. Balance is essential for proper function.`
        };

        return stepDescriptions[step.name] || step.description || `${step.name} occurs during ${topic}.`;
    }

    // Generate quiz from facts
    static generateQuiz(topic, facts) {
        const questions = [];

        // Generate from facts
        const medicalFacts = facts.filter(f => f.confidence >= 0.8);

        if (medicalFacts.length >= 4) {
            // Create multiple choice from facts
            for (let i = 0; i < Math.min(5, medicalFacts.length); i++) {
                const fact = medicalFacts[i];
                const question = this.factToQuestion(fact, topic);
                if (question) questions.push(question);
            }
        }

        // Fallback questions if not enough generated
        if (questions.length < 3) {
            questions.push(
                {
                    question: `What is ${topic}?`,
                    options: [
                        "A normal physiological process",
                        "A pathological condition",
                        "A medical procedure",
                        "A type of medication"
                    ],
                    correct: 0,
                    explanation: `${topic} is an important medical concept covered in this lesson.`
                },
                {
                    question: `Why is understanding ${topic} important?`,
                    options: [
                        "For passing exams only",
                        "For clinical diagnosis and treatment",
                        "It is not important",
                        "Only for research purposes"
                    ],
                    correct: 1,
                    explanation: `Understanding ${topic} is essential for clinical practice and patient care.`
                }
            );
        }

        return questions.slice(0, 6);
    }

    // Convert a fact to a quiz question
    static factToQuestion(fact, topic) {
        const words = fact.text.split(" ");
        const keyTerms = words.filter(w => w.length > 5 && /^[A-Z]/.test(w));

        if (keyTerms.length === 0) return null;

        const correctTerm = keyTerms[0] || topic.split(" ")[0];
        const distractors = ["Process A", "Structure B", "Molecule C", "Pathway D"].slice(0, 3);

        const options = [correctTerm, ...distractors];
        // Shuffle
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            question: `In the context of ${topic}, which is correct?`,
            options: options.map((opt, i) => `${i + 1}. ${opt}`),
            correct: options.indexOf(correctTerm),
            explanation: fact.text
        };
    }

    // Build animation steps from process steps
    static buildAnimationSteps(processSteps) {
        const effects = [
            "doctor_explain", "doctor_point_bacterium", "doctor_point_macrophage",
            "doctor_write", "glow_macrophage", "extend_pseudopods", "engulf",
            "form_phagosome", "fuse_lysosomes", "destroy"
        ];

        const cameraAngles = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8];

        return processSteps.map((step, i) => ({
            name: step.name,
            duration: 2.5,
            description: step.description,
            effect: effects[i % effects.length],
            camera: {
                distance: 18 - (i * 1.5),
                angle: cameraAngles[i % cameraAngles.length]
            }
        }));
    }

    // Summarize sources found
    static summarizeSources(research) {
        const sources = [];
        if (research.pubmed?.count > 0) sources.push(`PubMed: ${research.pubmed.count} articles`);
        if (research.openalex?.count > 0) sources.push(`OpenAlex: ${research.openalex.count} articles`);
        if (research.crossref?.count > 0) sources.push(`CrossRef: ${research.crossref.count} articles`);
        if (research.semanticScholar?.count > 0) sources.push(`SemanticScholar: ${research.semanticScholar.count} articles`);
        if (research.wikipedia) sources.push(`Wikipedia: ${research.wikipedia.title}`);
        if (research.googleScholar?.count > 0) sources.push(`GoogleScholar: ${research.googleScholar.count} results`);
        return sources;
    }
}

module.exports = Synthesizer;
