// ============================================
// AI Data Synthesizer - Generates topic-specific content
// ============================================

class Synthesizer {

    static synthesize(topic, researchData) {
        const facts = this.extractFacts(researchData, topic);
        const processSteps = this.extractProcessSteps(facts, topic);
        const narration = this.generateNarration(topic, facts, processSteps);
        const quiz = this.generateQuiz(topic, facts, researchData);
        const animationSteps = this.buildAnimationSteps(processSteps, topic);

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

        // Wikipedia - full summary is the best source
        if (research.wikipedia?.summary) {
            const sentences = research.wikipedia.summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
            sentences.forEach(s => {
                facts.push({ text: s.trim(), source: "Wikipedia", confidence: 0.9 });
            });
        }

        // PubMed - extract from titles (we don't have abstracts from summary API)
        if (research.pubmed?.articles) {
            research.pubmed.articles.forEach(article => {
                if (article.title) {
                    facts.push({ text: article.title, source: "PubMed", confidence: 0.85, journal: article.journal, year: article.year });
                }
            });
        }

        // OpenAlex - extract from titles
        if (research.openalex?.articles) {
            research.openalex.articles.forEach(article => {
                if (article.title) {
                    facts.push({ text: article.title, source: "OpenAlex", confidence: 0.8, citedBy: article.citedBy });
                }
            });
        }

        // CrossRef - extract from titles
        if (research.crossref?.articles) {
            research.crossref.articles.forEach(article => {
                if (article.title) {
                    facts.push({ text: article.title, source: "CrossRef", confidence: 0.7 });
                }
            });
        }

        // SemanticScholar - extract from titles
        if (research.semanticScholar?.articles) {
            research.semanticScholar.articles.forEach(article => {
                if (article.title) {
                    facts.push({ text: article.title, source: "SemanticScholar", confidence: 0.8 });
                }
            });
        }

        // DuckDuckGo - abstract text
        if (research.duckduckgo?.abstract) {
            const sentences = research.duckduckgo.abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
            sentences.forEach(s => {
                facts.push({ text: s.trim(), source: "DuckDuckGo", confidence: 0.75 });
            });
        }

        // Always add the topic itself as a fact
        facts.unshift({ text: topic, source: "Topic", confidence: 1.0 });

        return this.deduplicateFacts(facts);
    }

    static deduplicateFacts(facts) {
        const unique = [];
        const seen = new Set();
        for (const fact of facts) {
            const key = fact.text.toLowerCase().substring(0, 40);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(fact);
            }
        }
        return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 40);
    }

    static extractProcessSteps(facts, topic) {
        const steps = [];
        const topicLower = topic.toLowerCase();

        // Extract real content from research for each step
        const wikiFact = facts.find(f => f.source === "Wikipedia")?.text || "";
        const pubmedFacts = facts.filter(f => f.source === "PubMed").map(f => f.text);
        const openalexFacts = facts.filter(f => f.source === "OpenAlex").map(f => f.text);

        // Build steps from actual research
        steps.push({
            name: "Definition",
            description: wikiFact || topic + " is a significant topic in medical science.",
            source: wikiFact ? "Wikipedia" : "default"
        });

        if (pubmedFacts.length > 0) {
            steps.push({
                name: "Research Evidence",
                description: "Studies including: " + pubmedFacts.slice(0, 2).join("; "),
                source: "PubMed"
            });
        } else {
            steps.push({
                name: "Overview",
                description: topic + " involves complex biological mechanisms.",
                source: "default"
            });
        }

        if (openalexFacts.length > 0) {
            steps.push({
                name: "Key Findings",
                description: "Major research: " + openalexFacts.slice(0, 2).join("; "),
                source: "OpenAlex"
            });
        } else {
            steps.push({
                name: "Mechanism",
                description: "The underlying mechanism of " + topic + " involves multiple pathways.",
                source: "default"
            });
        }

        // Add topic-specific steps based on keywords
        const topicWords = topicLower.split(/\s+/);
        if (topicWords.some(w => ["pathogen", "infection", "bacteria", "virus", "disease"].includes(w))) {
            steps.push({
                name: "Clinical Significance",
                description: topic + " has important implications for diagnosis and treatment of infectious diseases.",
                source: "inferred"
            });
        } else if (topicWords.some(w => ["cell", "molecular", "biochemistry", "metabolism"].includes(w))) {
            steps.push({
                name: "Cellular Process",
                description: topic + " operates at the cellular level with precise molecular regulation.",
                source: "inferred"
            });
        } else if (topicWords.some(w => ["pharmacology", "drug", "therapy"].includes(w))) {
            steps.push({
                name: "Therapeutic Applications",
                description: "Understanding " + topic + " leads to better therapeutic strategies.",
                source: "inferred"
            });
        } else {
            steps.push({
                name: "Significance",
                description: topic + " is a fundamental concept in medical education and clinical practice.",
                source: "inferred"
            });
        }

        steps.push({
            name: "Conclusion",
            description: "In summary, " + topic + " encompasses " + facts.length + " documented findings across multiple research databases.",
            source: "synthesized"
        });

        return steps.slice(0, 8);
    }

    static generateNarration(topic, facts, steps) {
        const narration = [];

        narration.push({
            time: 0,
            text: "Let us explore " + topic + ". I will guide you through the latest research on this important topic."
        });

        let time = 2;
        for (const step of steps) {
            narration.push({
                time: time,
                text: step.description
            });
            time += 3;
        }

        narration.push({
            time: time,
            text: "This concludes our lesson on " + topic + ". Remember the key findings we discussed from " + facts.length + " research sources."
        });

        return narration;
    }

    static generateQuiz(topic, facts, research) {
        const questions = [];

        // Question from Wikipedia
        if (research.wikipedia?.summary) {
            questions.push({
                question: "What is " + topic + "?",
                options: [
                    research.wikipedia.summary.substring(0, 60) + "...",
                    "A type of medical equipment",
                    "A surgical procedure",
                    "A vitamin deficiency"
                ],
                correct: 0,
                explanation: research.wikipedia.summary
            });
        } else {
            questions.push({
                question: "What is " + topic + "?",
                options: [
                    "An important medical concept",
                    "A laboratory instrument",
                    "A type of surgery",
                    "A pharmaceutical drug"
                ],
                correct: 0,
                explanation: topic + " is a significant topic in medical science."
            });
        }

        // Question from PubMed
        if (research.pubmed?.articles?.length > 0) {
            const correctArticle = research.pubmed.articles[0];
            questions.push({
                question: "A recent PubMed study on " + topic + " was published in which journal?",
                options: [
                    correctArticle.journal || "Unknown Journal",
                    "Journal of Cooking",
                    "Sports Medicine Weekly",
                    "Automotive Research Letters"
                ],
                correct: 0,
                explanation: "Published in " + (correctArticle.journal || "peer-reviewed journal") + " (" + (correctArticle.year || "recent") + ")"
            });
        }

        // Question from sources count
        const totalSources = (research.pubmed?.count || 0) + (research.openalex?.count || 0) + (research.crossref?.count || 0);
        if (totalSources > 0) {
            questions.push({
                question: "How many total research sources were found for " + topic + "?",
                options: [
                    totalSources + " sources",
                    "Exactly 1 source",
                    "No sources found",
                    "Over 1000 sources"
                ],
                correct: 0,
                explanation: totalSources + " research articles and references were found across multiple databases."
            });
        }

        // Topic-specific question
        questions.push({
            question: "Why is studying " + topic + " important in medicine?",
            options: [
                "For clinical understanding and evidence-based practice",
                "Only for passing exams",
                "It is not important",
                "Only for historical interest"
            ],
            correct: 0,
            explanation: "Understanding " + topic + " is essential for clinical practice and evidence-based medicine."
        });

        return questions.slice(0, 6);
    }

    static buildAnimationSteps(processSteps, topic) {
        const effects = [
            "doctor_explain", "doctor_point_bacterium", "doctor_write",
            "doctor_point_macrophage", "glow_macrophage", "doctor_explain",
            "doctor_write", "doctor_point_bacterium"
        ];
        const cameraAngles = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];

        return processSteps.map((step, i) => ({
            name: step.name,
            duration: 3,
            description: step.description,
            effect: effects[i % effects.length],
            camera: {
                distance: 20 - (i * 1.2),
                angle: cameraAngles[i % cameraAngles.length]
            }
        }));
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
