"""
Medical Knowledge Base - Structured ontology for MBBS subjects
Supports RAG (Retrieval-Augmented Generation) for accurate medical content
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set
import json
from pathlib import Path


class MBBSSubject(Enum):
    ANATOMY = "anatomy"
    PHYSIOLOGY = "physiology"
    BIOCHEMISTRY = "biochemistry"
    PHARMACOLOGY = "pharmacology"
    PATHOLOGY = "pathology"
    MICROBIOLOGY = "microbiology"
    FORENSIC_MEDICINE = "forensic_medicine"
    COMMUNITY_MEDICINE = "community_medicine"
    OPHTHALMOLOGY = "ophthalmology"
    ENT = "ent"
    MEDICINE = "medicine"
    SURGERY = "surgery"
    OBSTETRICS_GYNECOLOGY = "obstetrics_gynecology"
    PEDIATRICS = "pediatrics"
    ORTHOPEDICS = "orthopedics"
    PSYCHIATRY = "psychiatry"
    DERMATOLOGY = "dermatology"
    RADIOLOGY = "radiology"
    ANESTHESIA = "anesthesia"
    EMERGENCY_MEDICINE = "emergency_medicine"


class HierarchyLevel(Enum):
    ORGANISM = "organism"
    SYSTEM = "system"
    ORGAN = "organ"
    TISSUE = "tissue"
    CELL = "cell"
    ORGANELLE = "organelle"
    MOLECULE = "molecule"
    ATOM = "atom"


@dataclass
class MedicalConcept:
    """Base class for all medical concepts"""
    id: str
    name: str
    subject: MBBSSubject
    hierarchy_level: HierarchyLevel
    description: str
    synonyms: List[str] = field(default_factory=list)
    related_concepts: List[str] = field(default_factory=list)  # IDs of related concepts
    tags: List[str] = field(default_factory=list)
    source_references: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "subject": self.subject.value,
            "hierarchy_level": self.hierarchy_level.value,
            "description": self.description,
            "synonyms": self.synonyms,
            "related_concepts": self.related_concepts,
            "tags": self.tags,
            "source_references": self.source_references,
        }


@dataclass
class Drug(MedicalConcept):
    """Pharmacology-specific concept"""
    drug_class: str = ""
    mechanism_of_action: str = ""
    indications: List[str] = field(default_factory=list)
    contraindications: List[str] = field(default_factory=list)
    side_effects: List[str] = field(default_factory=list)
    pharmacokinetics: Dict[str, str] = field(default_factory=dict)
    dosage_forms: List[str] = field(default_factory=list)


@dataclass
class Pathogen(MedicalConcept):
    """Microbiology-specific concept"""
    pathogen_type: str = ""  # bacteria, virus, fungus, parasite
    gram_stain: str = ""  # positive, negative, variable
    morphology: str = ""
    culture_requirements: List[str] = field(default_factory=list)
    virulence_factors: List[str] = field(default_factory=list)
    diseases_caused: List[str] = field(default_factory=list)
    lab_diagnosis: List[str] = field(default_factory=list)
    treatment: List[str] = field(default_factory=list)
    resistance_patterns: List[str] = field(default_factory=list)


@dataclass
class Disease(MedicalConcept):
    """Pathology/Medicine-specific concept"""
    etiology: List[str] = field(default_factory=list)
    pathogenesis: str = ""
    morphology: str = ""
    clinical_features: List[str] = field(default_factory=list)
    complications: List[str] = field(default_factory=list)
    investigations: List[str] = field(default_factory=list)
    treatment: List[str] = field(default_factory=list)
    prognosis: str = ""


class MedicalKnowledgeBase:
    """
    Central knowledge base with hierarchical medical ontology
    Supports querying by subject, hierarchy level, and relationships
    """

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.concepts: Dict[str, MedicalConcept] = {}
        self.subject_index: Dict[MBBSSubject, Set[str]] = {s: set() for s in MBBSSubject}
        self.level_index: Dict[HierarchyLevel, Set[str]] = {l: set() for l in HierarchyLevel}
        self.name_to_id: Dict[str, str] = {}

    def add_concept(self, concept: MedicalConcept) -> None:
        self.concepts[concept.id] = concept
        self.subject_index[concept.subject].add(concept.id)
        self.level_index[concept.hierarchy_level].add(concept.id)
        self.name_to_id[concept.name.lower()] = concept.id
        for synonym in concept.synonyms:
            self.name_to_id[synonym.lower()] = concept.id

    def get_concept(self, concept_id: str) -> Optional[MedicalConcept]:
        return self.concepts.get(concept_id)

    def find_by_name(self, name: str) -> Optional[MedicalConcept]:
        concept_id = self.name_to_id.get(name.lower())
        if concept_id:
            return self.concepts.get(concept_id)
        return None

    def get_by_subject(self, subject: MBBSSubject) -> List[MedicalConcept]:
        return [self.concepts[cid] for cid in self.subject_index[subject]]

    def get_by_level(self, level: HierarchyLevel) -> List[MedicalConcept]:
        return [self.concepts[cid] for cid in self.level_index[level]]

    def get_related(self, concept_id: str) -> List[MedicalConcept]:
        concept = self.concepts.get(concept_id)
        if not concept:
            return []
        return [self.concepts[cid] for cid in concept.related_concepts if cid in self.concepts]

    def search(self, query: str, subject: Optional[MBBSSubject] = None) -> List[MedicalConcept]:
        """Simple text search - replace with vector search in production"""
        query_lower = query.lower()
        results = []
        for concept in self.concepts.values():
            if subject and concept.subject != subject:
                continue
            if (query_lower in concept.name.lower() or
                query_lower in concept.description.lower() or
                any(query_lower in s.lower() for s in concept.synonyms)):
                results.append(concept)
        return results

    def get_hierarchy_path(self, concept_id: str) -> List[MedicalConcept]:
        """Get path from organism down to molecule for a concept"""
        concept = self.concepts.get(concept_id)
        if not concept:
            return []

        path = [concept]
        current = concept

        # Traverse up via related_concepts (parent relationships)
        while current.hierarchy_level != HierarchyLevel.ORGANISM:
            parent_id = next(
                (cid for cid in current.related_concepts
                 if self.concepts.get(cid, MedicalConcept).hierarchy_level.value
                 < current.hierarchy_level.value),
                None
            )
            if not parent_id or parent_id not in self.concepts:
                break
            current = self.concepts[parent_id]
            path.insert(0, current)

        return path

    def save_to_disk(self) -> None:
        """Save knowledge base to JSON files"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        for subject in MBBSSubject:
            subject_concepts = self.get_by_subject(subject)
            if subject_concepts:
                file_path = self.base_path / f"{subject.value}.json"
                with open(file_path, 'w') as f:
                    json.dump([c.to_dict() for c in subject_concepts], f, indent=2)

    def load_from_disk(self) -> None:
        """Load knowledge base from JSON files"""
        for subject in MBBSSubject:
            file_path = self.base_path / f"{subject.value}.json"
            if file_path.exists():
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    for item in data:
                        subject_enum = MBBSSubject(item["subject"])
                        level_enum = HierarchyLevel(item["hierarchy_level"])
                        concept = MedicalConcept(
                            id=item["id"],
                            name=item["name"],
                            subject=subject_enum,
                            hierarchy_level=level_enum,
                            description=item["description"],
                            synonyms=item.get("synonyms", []),
                            related_concepts=item.get("related_concepts", []),
                            tags=item.get("tags", []),
                            source_references=item.get("source_references", []),
                        )
                        self.add_concept(concept)


# ============================================================
# SEED DATA - Core medical concepts for bootstrapping
# ============================================================

def create_seed_knowledge_base(base_path: Path) -> MedicalKnowledgeBase:
    """Create initial knowledge base with core medical concepts"""
    kb = MedicalKnowledgeBase(base_path)

    # ----- ANATOMY - Hierarchy example -----
    # Organism level
    human = MedicalConcept(
        id="human_body",
        name="Human Body",
        subject=MBBSSubject.ANATOMY,
        hierarchy_level=HierarchyLevel.ORGANISM,
        description="The complete biological organism composed of multiple organ systems",
        synonyms=["human organism", "body"],
        tags=["anatomy", "organism"],
    )
    kb.add_concept(human)

    # System level
    cardiovascular_system = MedicalConcept(
        id="cardiovascular_system",
        name="Cardiovascular System",
        subject=MBBSSubject.ANATOMY,
        hierarchy_level=HierarchyLevel.SYSTEM,
        description="System comprising heart and blood vessels for circulation",
        synonyms=["circulatory system", "CVS"],
        related_concepts=["human_body"],
        tags=["anatomy", "system", "cardiovascular"],
    )
    kb.add_concept(cardiovascular_system)

    # Organ level
    heart = MedicalConcept(
        id="heart",
        name="Heart",
        subject=MBBSSubject.ANATOMY,
        hierarchy_level=HierarchyLevel.ORGAN,
        description="Muscular pump that maintains blood circulation",
        synonyms=["cardiac muscle", "myocardium"],
        related_concepts=["cardiovascular_system"],
        tags=["anatomy", "organ", "heart", "cardiology"],
    )
    kb.add_concept(heart)

    # Tissue level
    cardiac_muscle = MedicalConcept(
        id="cardiac_muscle_tissue",
        name="Cardiac Muscle Tissue",
        subject=MBBSSubject.ANATOMY,
        hierarchy_level=HierarchyLevel.TISSUE,
        description="Striated involuntary muscle found only in the heart",
        synonyms=["myocardium", "heart muscle"],
        related_concepts=["heart"],
        tags=["anatomy", "tissue", "muscle", "histology"],
    )
    kb.add_concept(cardiac_muscle)

    # Cell level
    cardiomyocyte = MedicalConcept(
        id="cardiomyocyte",
        name="Cardiomyocyte",
        subject=MBBSSubject.ANATOMY,
        hierarchy_level=HierarchyLevel.CELL,
        description="Cardiac muscle cell with single nucleus, branching, intercalated discs",
        synonyms=["cardiac muscle cell", "heart cell"],
        related_concepts=["cardiac_muscle_tissue"],
        tags=["anatomy", "cell", "histology", "cardiology"],
    )
    kb.add_concept(cardiomyocyte)

    # Molecule level
    troponin = MedicalConcept(
        id="troponin_complex",
        name="Troponin Complex",
        subject=MBBSSubject.BIOCHEMISTRY,
        hierarchy_level=HierarchyLevel.MOLECULE,
        description="Regulatory protein complex (TnC, TnI, TnT) controlling cardiac muscle contraction",
        synonyms=["troponin", "cTnI", "cTnT"],
        related_concepts=["cardiomyocyte"],
        tags=["biochemistry", "molecule", "protein", "cardiology", "biomarker"],
    )
    kb.add_concept(troponin)

    # ----- PHARMACOLOGY - Drug example -----
    metoprolol = Drug(
        id="metoprolol",
        name="Metoprolol",
        subject=MBBSSubject.PHARMACOLOGY,
        hierarchy_level=HierarchyLevel.MOLECULE,
        description="Cardioselective beta-1 adrenergic receptor blocker",
        synonyms=["metoprolol tartrate", "metoprolol succinate", "Lopressor", "Toprol-XL"],
        related_concepts=["heart", "cardiomyocyte"],
        tags=["pharmacology", "drug", "beta-blocker", "cardiology", "antihypertensive"],
        drug_class="Beta-1 selective adrenergic antagonist",
        mechanism_of_action="Competitive antagonism at beta-1 adrenergic receptors, reducing heart rate, contractility, and renin release",
        indications=["Hypertension", "Angina pectoris", "Heart failure (HFrEF)", "Post-MI", "Arrhythmias"],
        contraindications=["Severe bradycardia", "Heart block >1st degree", "Cardiogenic shock", "Severe peripheral arterial disease"],
        side_effects=["Bradycardia", "Fatigue", "Cold extremities", "Depression", "Bronchospasm (caution in asthma)", "Erectile dysfunction"],
        pharmacokinetics={
            "absorption": "~50% oral bioavailability",
            "distribution": "Vd ~3-5 L/kg",
            "metabolism": "Hepatic CYP2D6",
            "elimination": "Renal ~10%, fecal ~90%",
            "half_life": "3-7 hours",
        },
        dosage_forms=["Immediate-release tablets", "Extended-release tablets", "IV injection"],
    )
    kb.add_concept(metoprolol)

    # ----- MICROBIOLOGY - Pathogen example -----
    staph_aureus = Pathogen(
        id="staphylococcus_aureus",
        name="Staphylococcus aureus",
        subject=MBBSSubject.MICROBIOLOGY,
        hierarchy_level=HierarchyLevel.CELL,
        description="Gram-positive cocci in clusters, catalase-positive, coagulase-positive",
        synonyms=["S. aureus", "Staph aureus", "Golden staph"],
        related_concepts=[],
        tags=["microbiology", "bacteria", "gram-positive", "cocci", "pathogen"],
        pathogen_type="bacteria",
        gram_stain="positive",
        morphology="Gram-positive cocci in clusters",
        culture_requirements=["Aerobic", "Facultative anaerobe", "Grows on blood agar (beta-hemolysis)", "Mannitol salt agar selective"],
        virulence_factors=[
            "Protein A (Fc receptor binding)",
            "Coagulase (clots plasma)",
            "Catalase (H2O2 breakdown)",
            "Hemolysins (alpha, beta, delta, gamma)",
            "Leukocidins (PVL)",
            "Toxic shock syndrome toxin (TSST-1)",
            "Enterotoxins (food poisoning)",
            "Exfoliative toxins (SSSS)",
        ],
        diseases_caused=[
            "Skin/soft tissue infections (abscess, cellulitis, impetigo)",
            "Osteomyelitis, septic arthritis",
            "Endocarditis (right-sided in IV drug users)",
            "Pneumonia (post-viral)",
            "Sepsis, bacteremia",
            "Toxic shock syndrome",
            "Staphylococcal food poisoning",
            "Scalded skin syndrome (SSSS)",
        ],
        lab_diagnosis=[
            "Gram stain: Gram-positive cocci in clusters",
            "Culture: Beta-hemolytic colonies on blood agar, golden pigment",
            "Catalase positive, Coagulase positive",
            "Mannitol fermentation positive",
            "DNase test positive",
        ],
        treatment=[
            "MSSA: Nafcillin, Oxacillin, Cefazolin",
            "MRSA: Vancomycin, Linezolid, Daptomycin, Ceftaroline",
            "Mild skin: Clindamycin, TMP-SMX, Doxycycline",
        ],
        resistance_patterns=[
            "MRSA: mecA gene (PBP2a) - resistant to all beta-lactams",
            "VISA/VRSA: vanA/vanB genes - vancomycin resistance",
            "Penicillin resistance: beta-lactamase production (>90% strains)",
        ],
    )
    kb.add_concept(staph_aureus)

    # ----- PATHOLOGY - Disease example -----
    mi = Disease(
        id="myocardial_infarction",
        name="Myocardial Infarction",
        subject=MBBSSubject.PATHOLOGY,
        hierarchy_level=HierarchyLevel.ORGAN,
        description="Necrosis of cardiac muscle due to prolonged ischemia",
        synonyms=["MI", "heart attack", "acute coronary syndrome"],
        related_concepts=["heart", "cardiomyocyte", "troponin_complex", "metoprolol"],
        tags=["pathology", "cardiology", "disease", "ischemia", "necrosis"],
        etiology=["Atherosclerotic plaque rupture with thrombosis", "Coronary artery spasm", "Coronary embolism", "Supply-demand mismatch"],
        pathogenesis="Plaque rupture -> platelet adhesion/activation -> thrombus formation -> coronary occlusion -> ischemia -> necrosis (waves: subendocardial -> transmural over 4-6 hours)",
        morphology="Coagulative necrosis, neutrophilic infiltration (12-24h), macrophages (1-3 days), granulation tissue (1-2 weeks), fibrosis (weeks-months)",
        clinical_features=[
            "Crushing substernal chest pain >20 min, not relieved by rest",
            "Radiation to left arm, jaw, back",
            "Diaphoresis, nausea, dyspnea",
            "Atypical: silent MI (diabetics, elderly), epigastric pain",
        ],
        complications=[
            "Arrhythmias (VF, VT, AV block)",
            "Heart failure, cardiogenic shock",
            "Pericarditis (Dressler's syndrome)",
            "Ventricular aneurysm, rupture",
            "Papillary muscle rupture -> MR",
            "Ventricular septal rupture",
        ],
        investigations=[
            "ECG: ST elevation (STEMI) vs ST depression/T inversion (NSTEMI)",
            "Troponin I/T: gold standard, rises 3-4h, peaks 12-24h, stays 7-10 days",
            "CK-MB: rises 4-6h, peaks 12-24h, normalizes 48-72h",
            "Echo: regional wall motion abnormalities",
            "Coronary angiography: culprit lesion",
        ],
        treatment=[
            "STEMI: Primary PCI <90 min OR fibrinolysis <30 min if PCI unavailable",
            "Dual antiplatelet: Aspirin + P2Y12 inhibitor (ticagrelor/clopidogrel)",
            "Anticoagulation: Heparin/enoxaparin",
            "Beta-blocker (metoprolol), ACE inhibitor, Statin",
            "NSTEMI: Risk stratification, early invasive vs conservative",
        ],
        prognosis="Depends on infarct size, LV function, reperfusion time, complications",
    )
    kb.add_concept(mi)

    # Save seed data
    kb.save_to_disk()
    return kb


if __name__ == "__main__":
    from backend.config import settings
    kb = create_seed_knowledge_base(settings.KNOWLEDGE_BASE_DIR)
    print(f"Created knowledge base with {len(kb.concepts)} concepts")
    for subject in MBBSSubject:
        count = len(kb.get_by_subject(subject))
        if count > 0:
            print(f"  {subject.value}: {count} concepts")