// ============================================
// Entity Definitions Only - NO local database
// All research comes from the internet (7 databases)
// ============================================

const MedicalKnowledge = {
    entities: {
        macrophage: { id: "macrophage", type: "cell", scientificName: "Macrophage", commonName: "Macrophage", description: "Large phagocytic white blood cell that engulfs and digests pathogens.", color: 0x66b3ff, functions: ["Phagocytosis", "Antigen Presentation", "Cytokine Secretion"], tags: ["white blood cell", "phagocyte"] },
        bacterium: { id: "bacterium", type: "microorganism", scientificName: "Bacterium", commonName: "Bacterium", description: "Single-celled prokaryotic microorganism.", color: 0xd9534f, tags: ["pathogen"] },
        virus: { id: "virus", type: "microorganism", scientificName: "Virus", commonName: "Virus", description: "Obligate intracellular parasite with genetic material in a protein coat.", color: 0x9c27b0, tags: ["pathogen", "intracellular"] },
        human_cell: { id: "human_cell", type: "cell", scientificName: "Eukaryotic Cell", commonName: "Human Cell", description: "General human eukaryotic cell.", color: 0x99cc99, functions: ["Metabolism", "Protein Synthesis"], tags: ["eukaryotic"] },
        red_blood_cell: { id: "red_blood_cell", type: "cell", scientificName: "Erythrocyte", commonName: "Red Blood Cell", description: "Oxygen-carrying blood cell containing hemoglobin.", color: 0xe53935, functions: ["Oxygen Transport", "CO2 Transport"], tags: ["blood", "oxygen"] },
        neuron: { id: "neuron", type: "cell", scientificName: "Neuron", commonName: "Nerve Cell", description: "Electrically excitable cell that transmits nerve impulses.", color: 0xffb300, functions: ["Signal Transmission", "Integration"], tags: ["nervous system"] },
        heart_cell: { id: "heart_cell", type: "cell", scientificName: "Cardiomyocyte", commonName: "Heart Muscle Cell", description: "Striated muscle cell of the heart.", color: 0xc62828, functions: ["Contraction", "Pumping"], tags: ["cardiovascular"] },
        kidney_cell: { id: "kidney_cell", type: "cell", scientificName: "Nephron Cell", commonName: "Kidney Cell", description: "Functional unit of the kidney.", color: 0x6d4c41, functions: ["Filtration", "Reabsorption"], tags: ["renal"] },
        nucleus: { id: "nucleus", type: "organelle", scientificName: "Nucleus", commonName: "Nucleus", description: "Contains DNA. Controls cell activities.", color: 0x4d4dff, tags: ["genetic material"] },
        mitochondria: { id: "mitochondria", type: "organelle", scientificName: "Mitochondrion", commonName: "Mitochondria", description: "Powerhouse of the cell. Produces ATP.", color: 0xe64a19, tags: ["energy", "ATP"] },
        lysosomes: { id: "lysosomes", type: "organelle", scientificName: "Lysosome", commonName: "Lysosome", description: "Digestive organelle with hydrolytic enzymes.", color: 0xfdd835, tags: ["digestion"] },
        phagosome: { id: "phagosome", type: "structure", scientificName: "Phagosome", commonName: "Phagosome", description: "Vesicle formed around engulfed material.", color: 0x7cb342, tags: ["vesicle"] },
        phagolysosome: { id: "phagolysosome", type: "structure", scientificName: "Phagolysosome", commonName: "Phagolysosome", description: "Active digestion compartment.", color: 0xcc7a00, tags: ["digestion"] },
        ribosome: { id: "ribosome", type: "organelle", scientificName: "Ribosome", commonName: "Ribosome", description: "Protein synthesis machinery.", color: 0x7b1fa2, tags: ["protein"] },
        er: { id: "er", type: "organelle", scientificName: "Endoplasmic Reticulum", commonName: "Endoplasmic Reticulum", description: "Protein folding and lipid synthesis.", color: 0x0277bd, tags: ["protein", "lipid"] },
        golgi: { id: "golgi", type: "organelle", scientificName: "Golgi Apparatus", commonName: "Golgi Apparatus", description: "Modifies and packages proteins.", color: 0x00838f, tags: ["packaging"] },
        membrane: { id: "membrane", type: "structure", scientificName: "Cell Membrane", commonName: "Cell Membrane", description: "Phospholipid bilayer barrier.", color: 0x546e7a, tags: ["barrier"] }
    },

    findRecipe(topic) { return null; },
    searchEntities(query) {
        const q = query.toLowerCase();
        return Object.values(this.entities).filter(e => e.commonName.toLowerCase().includes(q) || e.scientificName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    },
    getEntity(id) { return this.entities[id] || null; },
    getTopics() { return []; },
    getAllRecipes() { return []; }
};
