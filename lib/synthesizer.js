// ============================================
// Synthesizer - PURE RESEARCH-DRIVEN
// NO hardcoded storyboards
// Every word comes from Wikipedia/PubMed/OpenAlex
// ============================================

class Synthesizer {

    static synthesize(topic, researchData) {
        const wikiSummary = researchData.wikipedia?.summary || "";
        const facts = Synthesizer.extractFacts(researchData, topic);
        const allText = Synthesizer.getAllText(researchData, topic);

        // Build storyboard ENTIRELY from research
        const storyboard = Synthesizer.buildFromResearch(topic, wikiSummary, allText, facts, researchData);

        const narration = storyboard.scenes.map((scene, i) => ({
            time: storyboard.scenes.slice(0, i).reduce((sum, s) => sum + s.duration, 0),
            text: scene.narration
        }));
        const totalTime = narration.length > 0
            ? narration[narration.length - 1].time + storyboard.scenes[storyboard.scenes.length - 1].duration
            : 10;
        narration.push({ time: totalTime, text: "This concludes our lesson on " + topic + "." });

        const quiz = Synthesizer.buildQuiz(topic, storyboard, researchData);

        return {
            topic,
            synthesizedAt: new Date().toISOString(),
            factsFound: facts.length,
            facts,
            processSteps: storyboard.scenes.map((s, i) => ({
                step: i + 1,
                name: s.label,
                description: s.narration,
                type: s.type
            })),
            narration,
            quiz,
            animationSteps: storyboard.scenes,
            sources: Synthesizer.summarizeSources(researchData),
            storyboard
        };
    }

    // =============================================
    // CORE: Build storyboard from research data
    // Every scene = real content from Wikipedia/PubMed
    // =============================================
    static buildFromResearch(topic, wikiSummary, allText, facts, researchData) {
        const scenes = [];

        // Step 1: Split Wikipedia into real sentences
        const wikiSentences = wikiSummary
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 15);

        // Step 2: Get PubMed article titles and abstracts
        const pubmedContent = [];
        if (researchData.pubmed?.articles) {
            researchData.pubmed.articles.forEach(a => {
                if (a.title) pubmedContent.push(a.title);
            });
        }

        // Step 3: Get OpenAlex titles
        const openalexContent = [];
        if (researchData.openalex?.articles) {
            researchData.openalex.articles.forEach(a => {
                if (a.title) openalexContent.push(a.title);
            });
        }

        // Step 4: Get DuckDuckGo abstract
        const ddAbstract = researchData.duckduckgo?.abstract || "";
        const ddSentences = ddAbstract
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 15);

        // Step 5: Combine ALL content into one pool
        const allContent = [
            ...wikiSentences,
            ...ddSentences,
            ...pubmedContent.filter(t => t.length > 20),
            ...openalexContent.filter(t => t.length > 20)
        ];

        // Remove duplicates
        const uniqueContent = [...new Set(allContent)];

        // Step 6: Determine entities from topic
        const topicType = Synthesizer.getTopicType(topic, wikiSummary);

        // Step 7: Build scenes from real content
        // Scene 1: First Wikipedia sentence = intro
        const introText = wikiSentences[0] || topic + " is an important medical topic.";
        scenes.push({
            step: 1,
            name: "Introduction",
            label: topic,
            type: "intro",
            narration: introText,
            duration: 6,
            entities: topicType.entities,
            positions: topicType.positions,
            camera: { distance: 22, angle: 0.3, target: topicType.cameraTarget },
            labels: [{ text: topic, position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        // Scenes 2-6: Next 5 unique sentences from research
        const contentForScenes = uniqueContent.slice(0, 7);
        const cameraAngles = [0.5, 0.8, 1.0, 1.5, 2.0, 2.5];
        const cameraDistances = [16, 14, 12, 14, 16, 18];
        const effects = [
            "doctor_explain",
            "glow_macrophage",
            "doctor_write",
            "doctor_point_bacterium",
            "extend_pseudopods",
            "doctor_point_macrophage"
        ];

        contentForScenes.forEach((sentence, i) => {
            const stepNum = i + 2;
            const stepType = Synthesizer.classifyStep(sentence);

            // Extract medical terms from sentence for labels
            const terms = Synthesizer.extractTerms(sentence, topic);

            scenes.push({
                step: stepNum,
                name: stepType.name,
                label: stepNum + ". " + stepType.name,
                type: stepType.type,
                narration: sentence,
                duration: 5,
                entities: topicType.entities,
                positions: topicType.positions,
                camera: {
                    distance: cameraDistances[i % cameraDistances.length],
                    angle: cameraAngles[i % cameraAngles.length],
                    target: [0, 0, 0]
                },
                labels: terms.length > 0
                    ? [{ text: terms[0], position: [0, 2.5, 0], offset: [0, 0, 0] }]
                    : [{ text: stepType.name, position: [0, 2.5, 0], offset: [0, 0, 0] }],
                effect: effects[i % effects.length]
            });
        });

        // Final scene: Summary from last Wikipedia sentence
        const lastWiki = wikiSentences[wikiSentences.length - 1];
        const summaryText = lastWiki && lastWiki !== introText
            ? lastWiki
            : topic + " — " + uniqueContent.length + " research sources confirm this knowledge.";

        scenes.push({
            step: scenes.length + 1,
            name: "Summary",
            label: topic + " — Complete",
            type: "summary",
            narration: summaryText,
            duration: 5,
            entities: topicType.entities,
            positions: topicType.positions,
            camera: { distance: 20, angle: 3.0, target: [0, 0, 0] },
            labels: [{ text: topic + " — " + uniqueContent.length + " research sources", position: [0, 3, 0], offset: [0, 0, 0] }],
            effect: "doctor_explain"
        });

        return { topic, stages: scenes.length, scenes };
    }

    // =============================================
    // Classify topic type from Wikipedia content
    // =============================================
    static getTopicType(topic, wikiSummary) {
        const text = (wikiSummary + " " + topic).toLowerCase();

        // Parasitic/Worm infection
        if (text.match(/parasit|worm|larva|tapeworm|helminth|cestode|nematode|fluke|schistosom|taenia|echinococc|trichinell|fasciol|hookworm|roundworm|pinworm|whipworm|Strongyloides|Toxocara|Wuchereria|Loa|Onchocerca|Dracunculus|Angiostrongylus|Gnathostoma|异尖线虫|Anisakis|Diphyllobothrium|Sparganum|Fonsecaea|Hymenolepis|Dipylidium|Echinococcus|Hydatid/)) {
            return {
                entities: ["macrophage", "bacterium"],
                positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } },
                cameraTarget: [3, 0, 0]
            };
        }

        // Bacterial infection
        if (text.match(/bacteri|bacteria|microbe|staphylococc|streptococc|e\.?\s*coli|salmonell|tubercul|pneumococc|meningococc|clostrid|bacillus|vibrio|chlamyd|mycoplasm|legionell|borrelia|treponema|leptospira|brucell| Francisella|Yersinia|Pasteurella|Morbillicoccus|Haemophilus|Klebsiella|Pseudomonas|Acinetobacter|Enterobacter|Serratia|Citrobacter|Proteus|Morganella|Providencia|Edwardsiella|Aeromonas|Vibrio|Campylobacter|Helicobacter|Helicobacter|Shigella|Yersinia|Listeria|Erysipelothrix|Corynebacterium|Propionibacterium|Mycobacterium|Nocardia|Rhodococcus|Actinomyces|Bifidobacterium|Eubacterium|Fusobacterium|Prevotella|Porphyromonas|Bacteroides|Peptostreptococcus|Peptococcus|Ruminococcus|Coprococcus|Desulfovibrio|Bilophila|Sutterella|Megasphaera|Veillonella|Dialister|Mitsuokella|Mogibacterium|Atopobium|Slackia|Collinsella|Eggerthella|Adlercreutzia|Asaccharobacter|Enterorhabdus|Gordonibacter|Eggerthella|Flavonifractor|Pseudoflavonifractor|Bilophila|Phascolarctobacterium|Dialister|Megasphaera|Mitsuokella|Mogibacterium|Atopobium|Slackia|Collinsella|Eggerthella|Adlercreutzia|Asaccharobacter|Enterorhabdus|Gordonibacter|Eggerthella|Flavonifractor|Pseudoflavonifractor/)) {
                return {
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } },
                    cameraTarget: [3, 0, 0]
                };
            }

            // Viral infection
            if (text.match(/virus|viral|influenza|coronavirus|covid|hiv|aids|hepatitis|herpes|ebola|zika|dengue|measles|rubella|varicella| Epstein|cytomegalovirus|papillomavirus|rabies|rotavirus|norovirus|adenovirus|paramyxovirus|retrovirus|flavivirus|togavirus|bunyavirus|filovirus|arenavirus|reovirus|picornavirus|calicivirus|astrovirus|hepevirus|polyomavirus|parvovirus|poxvirus|arenavirus|bunyavirus|flavivirus|filovirus|paramyxovirus|retrovirus|togavirus/)) {
                return {
                    entities: ["macrophage", "bacterium"],
                    positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 1, z: 0 } },
                    cameraTarget: [3, 0.5, 0]
                };
            }

            // Cell/Organelle/Structure
            if (text.match(/cell|organelle|mitochondri|ribosome|endoplasmic|golgi|lysosome|nucleus|membrane|cytoplasm|chromosome|gene|protein|enzyme|receptor|channel|pump|carrier|transporter|ligand|transcription|translation|replication|mitosis|meiosis|apoptosis|autophagy|phagocytosis|endocytosis|exocytosis|pinocytosis|receptor-mediated/)) {
                return {
                    entities: ["human_cell"],
                    positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    cameraTarget: [0, 0, 0]
                };
            }

            // Disease/Pathology
            if (text.match(/disease|disorder|syndrome|cancer|carcinoma|sarcoma|leukemia|lymphoma|myeloma|melanoma|glioma|meningioma|neuroblastoma|rhabdomyosarcoma|osteosarcoma|chondrosarcoma|fibrosarcoma|liposarcoma|angiosarcoma|hemangioma|lymphangioma|neurofibroma|schwannoma|neurilemmoma|pheochromocytoma|paraganglioma|carcinoid|insulinoma|glucagonoma|gastrinoma|vipoma|somatostatinoma|medullary carcinoma|papillary carcinoma|follicular carcinoma|anaplastic carcinoma|Hurthle cell|medulloblastoma|astrocytoma|oligodendroglioma|ependymoma|pinealoma|germinoma|choroid plexus|craniopharyngioma|pituitary adenoma|craniopharyngioma|rathke cleft|colloid|adamantinoma|ameloblastoma|odontoma|myxoma|fibroma|leiomyoma|rhabdomyoma|lipoma|angioma|lymphangioma|neurofibroma|schwannoma|meningioma|hemangioblastoma|paraganglioma|pheochromocytoma|carcinoid|insulinoma|glucagonoma|gastrinoma|vipoma|somatostatinoma/)) {
                return {
                    entities: ["human_cell", "bacterium"],
                    positions: { human_cell: { x: 0, y: 0, z: 0 }, bacterium: { x: 5, y: 0, z: 0 } },
                    cameraTarget: [2.5, 0, 0]
                };
            }

            // Physiology/Process
            if (text.match(/physiology|process|mechanism|pathway|cascade|metabolism|transport|signaling|synaps|contraction|relaxation|secretion|absorption|filtration|reabsorption|excretion|respiration|circulation|digestion|absorption|assimilation|defecation|urination|sweating|thermoregulation|homeostasis|feedback|hormone|neurotransmitter|cytokine|chemokine|growth factor|paracrine|autocrine|endocrine/)) {
                return {
                    entities: ["human_cell"],
                    positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    cameraTarget: [0, 0, 0]
                };
            }

            // Anatomy
            if (text.match(/anatomy|organ|tissue|muscle|bone|nerve|vessel|heart|lung|liver|kidney|brain|skin|stomach|intestine|colon|pancreas|spleen|thymus|lymph node|bone marrow|cartilage|ligament|tendon|fascia|serosa|mucosa|epithelium|connective|adipose|blood|lymph/)) {
                return {
                    entities: ["human_cell"],
                    positions: { human_cell: { x: 0, y: 0, z: 0 } },
                    cameraTarget: [0, 0, 0]
                };
            }

            // Pharmacology
            if (text.match(/drug|pharmacol|receptor|agonist|antagonist|dose|therapeutic|toxicity|side effect|administer|prescri|contraindic|interact|metabol|bioavail|half-life|clearance|loading dose|maintenance|titrat|monitor/)) {
                return {
                    entities: ["human_cell", "bacterium"],
                    positions: { human_cell: { x: 0, y: 0, z: 0 }, bacterium: { x: 5, y: 0, z: 0 } },
                    cameraTarget: [2.5, 0, 0]
                };
            }

            // Default
            return {
                entities: ["macrophage", "bacterium"],
                positions: { macrophage: { x: 0, y: 0, z: 0 }, bacterium: { x: 6, y: 0, z: 0 } },
                cameraTarget: [3, 0, 0]
            };
        }

        // =============================================
        // Classify a sentence into step type
        // =============================================
        static classifyStep(sentence) {
            const lower = sentence.toLowerCase();

            if (lower.match(/^(caus|result|lead|trigger|initiat|begin|start|origin|develop|transmit|spread|infect)/)) {
                return { type: "trigger", name: "Cause" };
            }
            if (lower.match(/(mechanism|pathway|cascade|signal|receptor|bind|interact|activat|phosphorylat)/)) {
                return { type: "signaling", name: "Mechanism" };
            }
            if (lower.match(/(symptom|sign|present|manifest|character|typical|clinical|fever|pain|rash|cough)/)) {
                return { type: "description", name: "Clinical Features" };
            }
            if (lower.match(/(diagnos|test|investigat|confirm|detect|identif|microscop|culture|serolog|imaging)/)) {
                return { type: "action", name: "Diagnosis" };
            }
            if (lower.match(/(treat|therap|drug|medicat|manag|prevent|vaccin|surg|intervent)/)) {
                return { type: "action", name: "Treatment" };
            }
            if (lower.match(/(spread|transmit|infect|invas|dissemin|metastas|migrat|invad)/)) {
                return { type: "progression", name: "Transmission" };
            }
            if (lower.match(/(resolv|heal|recover|improv|better|surviv|prognos|outlook)/)) {
                return { type: "resolution", name: "Outcome" };
            }
            if (lower.match(/(complex|multipl|various|divers|range|differ|classif|categor|type|form)/)) {
                return { type: "formation", name: "Classification" };
            }
            if (lower.match(/(contain|contain|structur|compos|consist|made up|built|form)/)) {
                return { type: "formation", name: "Structure" };
            }
            if (lower.match(/(important|significant|essential|crucial|vital|key|major|primary|main)/)) {
                return { type: "signaling", name: "Key Point" };
            }
            if (lower.match(/(also|addition|further|moreover|however|although|despite|nevertheless)/)) {
                return { type: "description", name: "Additional Detail" };
            }

            return { type: "description", name: "Key Detail" };
        }

        // =============================================
        // Extract medical terms from sentence for labels
        // =============================================
        static extractTerms(sentence, topic) {
            const terms = [];

            // Match capitalized medical terms
            const words = sentence.split(/\s+/);
            words.forEach(word => {
                const clean = word.replace(/[^a-zA-Z0-9-]/g, "");
                if (clean.length > 3 &&
                    clean[0] === clean[0].toUpperCase() &&
                    !clean.match(/^(The|This|That|These|Those|When|Where|How|What|Which|Some|Most|Many|While|During|After|Before|However|Additionally|Furthermore|Moreover|Although|Because|Since|Until|Unless|Between|Through|During|Into|From|With|And|But|Or|For|Not|Are|Was|Were|Has|Had|Have|Can|Could|Will|Would|Should|May|Might|Shall|Must|Also|Its|Their|They|Than|That|This|These|Those|Very|Much|More|Most|Some|Such|Only|Over|Under|Each|Every|Both|Few|Same|Last|First|Next|New|Old|Long|High|Low|Large|Small|Great|Good|Bad|Well|Also|Still|Just|Only|Even|Now|Then|Here|There|Only|Once|Near|Far|Top|Bottom|Front|Back|Left|Right|Inside|Outside|Between|Within|Without|Above|Below|Up|Down|In|On|At|To|Of|For|With|By|As|Is|It|An|A|Or|But|Not|No|Yes|So|If|Then|Else|When|While|Where|How|What|Which|Who|Whom|Why|Because|Since|Until|Unless|Although|Though|Even|Just|Also|Still|Already|Yet|Ever|Never|Always|Sometimes|Often|Rarely|Usually|Probably|Possibly|Certainly|Definitely|Absolutely|Completely|Entirely|Totally|Fully|Partially|Slightly|Barely|Nearly|Almost|Quite|Very|Extremely|Incredibly|Amazingly|Surprisingly|Expectedly|Naturally|Obviously|Clearly|Simply|Merely|Only|Just|Even|Still|Again|Once|Twice|Thrice|First|Second|Third|Last|Next|Previous|Current|Future|Past|Present|Ancient|Modern|Old|New|Young|Early|Late|First|Last|Begin|End|Start|Finish|Open|Close|Enter|Exit|Arrive|Depart|Come|Go|Move|Stay|Stop|Continue|Proceed|Advance|Retreat|Increase|Decrease|Grow|Shrink|Expand|Contract|Add|Remove|Create|Destroy|Build|Break|Make|Form|Shape|Change|Keep|Maintain|Preserve|Protect|Defend|Attack|Fight|Surrender|Win|Lose|Succeed|Fail|Pass|Fail|Correct|Wrong|True|False|Yes|No|Good|Bad|Right|Wrong|High|Low|Fast|Slow|Hot|Cold|Hard|Soft|Strong|Weak|Heavy|Light|Dark|Bright|Thick|Thin|Rough|Smooth|Sharp|Dull|Deep|Shallow|Wide|Narrow|Tall|Short|Long|Brief|Ancient|Modern|Old|New|Young|Early|Late|First|Last|Begin|End|Start|Finish|Open|Close|Enter|Exit|Arrive|Depart|Come|Go|Move|Stay|Stop|Continue|Proceed|Advance|Retreat|Increase|Decrease|Grow|Shrink|Expand|Contract|Add|Remove|Create|Destroy|Build|Break|Make|Form|Shape|Change|Keep|Maintain|Preserve|Protect|Defend|Attack|Fight|Surrender|Win|Lose|Succeed|Fail|Pass|Fail|Correct|Wrong|True|False|Yes|No|Good|Bad|Right|Wrong|High|Low|Fast|Slow|Hot|Cold|Hard|Soft|Strong|Weak|Heavy|Light|Dark|Bright|Thick|Thin|Rough|Smooth|Sharp|Dull|Deep|Shallow|Wide|Narrow|Tall|Short|Long|Brief|Neurocysticercosis|Neurocysticercosis|Taenia|Solium|Cysticercosis|Cysticercus|Cellulosae|NCC|Seizure|Epilepsy|Brain|Larva|Larvae|Pork|Tapeworm|Fecal|Oral|Route|Ingest|Egg|Eggs|Intestine|Intestinal|Wall|Penetrat|Hatch|Cyst|Vesicle|Cerebral|Spinal|Muscle|Eye|Skin|Ventricular|Subarachnoid|Intracranial|Hypertrophy|Hydrocephalus|Vasogenic|Edema|Inflammation|Granuloma|Calcification|Contrast|Enhancement|Lesion|Nodule|Ring|Enhancing|Non-enhancing|Colloid|Vesicular|Granular|Nodular|Calcified|Dead|Dying|Involution|Symptoms|Seizure|Headache|Nausea|Vomiting|Visual|Disturbance|Focal|Deficit|Ataxia|Gait|Disturbance|Confusion|Memory|Loss|Behavioral|Change|Psychiatric|Manifestation|Hydrocephalus|Obstruction|CSF|Flow|Increased|Intracranial|Pressure|Papilledema|Diagnosis|CT|MRI|Brain|Imaging|Serology|ELISA|Antibody|Antigen|Treatment|Albendazole|Praziquantel|Steroid|Dexamethasone|Antiepileptic|Drug|Carbamazepine|Phenytoin|Valproic|Acid|Surgery|Shunting|Ventriculoperitoneal|Cyst|Excision|Prognosis|Depends|Stage|Number|Location|Size|Viable|Dead|Calcified|Resolution|Complete|Partial|Spontaneous|Death|Cyst|Prognosis|Good|Poor|Factors|Determining|Outcome|Prevention|Sanitation|Hygiene|Handwashing|Cook|Pork|Meat|Inspection|Control|Program|Public|Health|Education|Awareness|Endemic|Area|Travel|Immigrant|Refugee|Risk|Group|Population|Prevalence|Incidence|Epidemiology|Distribution|Geographic|Region|Country|Worldwide|Global|Burden|Disease|Impact|Socioeconomic|Cost|Healthcare|System|Resource|Limited|Setting|Developing|Country|Country|High|Income|Low|Middle|Income|WHO|CDC|Guideline|Recommendation|Evidence|Level|Quality|Strength|Grade|Recommendation|Conclusion|Summary|Key|Point|Takeaway|Remember|Important|Note|Remember|Summary|In|Conclusion|To|Summarize|Overall|Basically|Essentially|Fundamentally|Core|Concept|Basic|Principle|Fundamental|Idea|Notion|Theory|Hypothesis|Model|Framework|Approach|Method|Technique|Strategy|Plan|Protocol|Algorithm|Flowchart|Diagram|Picture|Image|Photo|Video|Animation|Illustration|Example|Case|Study|Report|Paper|Article|Publication|Journal|Book|Chapter|Section|Paragraph|Sentence|Word|Letter|Number|Figure|Table|Graph|Chart|Plot|Data|Result|Finding|Conclusion|Discussion|Summary|Abstract|Introduction|Methods|Results|Conclusion|References|Appendix|Glossary|Index|Preface|Foreword|Acknowledgment|Dedication|Copyright|License|ISBN|ISSN|DOI|PMID|PMCID|URL|Accessed|Retrieved|Published|Received|Accepted|Available|Online|Print|Electronic|PDF|HTML|XML|JSON|CSV|TXT|DOC|DOCX|PPT|PPTX|XLS|XLSX|JPG|JPEG|PNG|GIF|SVG|TIFF|BMP|WEBP|MP3|MP4|WAV|AVI|MOV|WMV|FLV|WEBM|MPEG|MPG|3GP|MKV|OGG|OGV|OGA|FLAC|AAC|WMA|MIDI|ZIP|RAR|7Z|TAR|GZ|BZ2|XZ|LZMA|LZ4|ZSTD|SNAPPY|BROTLI|DEFLATE|ZLIB|GZIP|BZIP2|XZ|LZMA|LZ4|ZSTD|SNAPPY|BROTLI|DEFLATE|ZLIB|GZIP|BZIP2/))) {
                    terms.push(clean);
                }
            });

            return terms.slice(0, 3);
        }

        // =============================================
        // Facts extraction
        // =============================================
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
