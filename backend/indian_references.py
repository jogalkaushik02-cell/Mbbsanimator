"""
Indian Medical Reference Database
Standard MBBS textbooks used across Indian medical colleges
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class ReferenceBook:
    title: str
    authors: List[str]
    publisher: str
    edition: str
    subject: str
    indian_relevance: str  # Why this is standard in India
    keywords: List[str] = field(default_factory=list)


# ============================================================
# Standard MBBS Textbooks Used in India
# ============================================================

INDIAN_MEDICAL_REFERENCES: List[ReferenceBook] = [
    # --- ANATOMY ---
    ReferenceBook(
        title="B.D. Chaurasia's Human Anatomy",
        authors=["B.D. Chaurasia"],
        publisher="McGraw Hill India",
        edition="7th Edition",
        subject="anatomy",
        indian_relevance="Gold standard anatomy textbook for all Indian medical colleges. Recommended by MCI/NMC.",
        keywords=["anatomy", "human body", "bones", "muscles", "nerves", "organs", "dissection", "histology"],
    ),
    ReferenceBook(
        title="Gray's Anatomy for Students",
        authors=["Richard Drake", "Adam Mitchell"],
        publisher="Elsevier India",
        edition="4th Edition",
        subject="anatomy",
        indian_relevance="Widely used supplementary anatomy text in Indian colleges.",
        keywords=["anatomy", "clinical anatomy", "imaging"],
    ),

    # --- PHYSIOLOGY ---
    ReferenceBook(
        title="Guyton and Hall Textbook of Medical Physiology",
        authors=["John E. Hall", "Michael E. Hall"],
        publisher="Elsevier India",
        edition="14th Edition",
        subject="physiology",
        indian_relevance="Most recommended physiology textbook in Indian MBBS curriculum.",
        keywords=["physiology", "cardiovascular", "renal", "neurophysiology", "endocrine", "GI"],
    ),
    ReferenceBook(
        title="A.K. Jain's Textbook of Physiology",
        authors=["A.K. Jain"],
        publisher="CBS Publishers",
        edition="6th Edition",
        subject="physiology",
        indian_relevance="Popular Indian author physiology book, widely used in Indian medical colleges.",
        keywords=["physiology", "indian author"],
    ),

    # --- BIOCHEMISTRY ---
    ReferenceBook(
        title="Harper's Illustrated Biochemistry",
        authors=["Robert K. Murray", "David A. Bender"],
        publisher="McGraw Hill India",
        edition="31st Edition",
        subject="biochemistry",
        indian_relevance="Standard biochemistry textbook used across Indian medical colleges.",
        keywords=["biochemistry", "metabolism", "enzymes", "vitamins", "molecular biology"],
    ),
    ReferenceBook(
        title="Pankaja's Biochemistry",
        authors=["Pankaja Naik"],
        publisher="Jaypee Brothers",
        edition="4th Edition",
        subject="biochemistry",
        indian_relevance="Indian author biochemistry book, popular for exams.",
        keywords=["biochemistry", "indian author", "metabolism"],
    ),

    # --- PHARMACOLOGY ---
    ReferenceBook(
        title="K.D. Tripathi's Essentials of Medical Pharmacology",
        authors=["K.D. Tripathi"],
        publisher="Jaypee Brothers Medical Publishers",
        edition="8th Edition",
        subject="pharmacology",
        indian_relevance="THE standard pharmacology textbook for Indian MBBS students. Used in virtually every Indian medical college.",
        keywords=["pharmacology", "drugs", "drug action", "therapeutics", "KDT", "tripathi"],
    ),
    ReferenceBook(
        title="Sharma & Sharma's Pharmacology",
        authors=["P.V. Sharma"],
        publisher="Chaukhambha Publications",
        edition="10th Edition",
        subject="pharmacology",
        indian_relevance="Classical Indian pharmacology reference, especially for traditional pharmacology.",
        keywords=["pharmacology", "indian", "ayurvedic pharmacology"],
    ),

    # --- PATHOLOGY ---
    ReferenceBook(
        title="Robbins & Cotran Pathologic Basis of Disease",
        authors=["Abul K. Abbas", "Andrew H. Lichtman", "Shiv Pillai"],
        publisher="Elsevier India",
        edition="10th Edition",
        subject="pathology",
        indian_relevance="Global gold standard, heavily used in Indian MBBS and PG preparation.",
        keywords=["pathology", "disease mechanisms", "inflammation", "neoplasia", "robbins"],
    ),
    ReferenceBook(
        title="Ramdas Nayak's Textbook of Pathology",
        authors=["Ramdas Nayak"],
        publisher="Jaypee Brothers",
        edition="3rd Edition",
        subject="pathology",
        indian_relevance="Indian author pathology book aligned with Indian university exams.",
        keywords=["pathology", "indian author"],
    ),

    # --- MICROBIOLOGY ---
    ReferenceBook(
        title="Ananthanarayan and Paniker's Textbook of Microbiology",
        authors=["R. Ananthanarayan", "C.K.J. Paniker"],
        publisher="Orient Blackswan",
        edition="10th Edition",
        subject="microbiology",
        indian_relevance="THE standard microbiology textbook for Indian MBBS. Universally recommended in Indian medical colleges.",
        keywords=["microbiology", "bacteria", "virus", "parasitology", "immunology", "ananthanarayan"],
    ),
    ReferenceBook(
        title="Chatterjee's Textbook of Microbiology",
        authors=["Chatterjee"],
        publisher="Current Books International",
        edition="8th Edition",
        subject="microbiology",
        indian_relevance="Popular alternative microbiology text in Indian colleges.",
        keywords=["microbiology", "indian"],
    ),

    # --- FORENSIC MEDICINE ---
    ReferenceBook(
        title="Reddy's Essential of Forensic Medicine and Toxicology",
        authors=["K.S. Narayan Reddy"],
        publisher="Jaypee Brothers",
        edition="30th Edition",
        subject="forensic_medicine",
        indian_relevance="Most popular forensic medicine textbook in Indian medical colleges.",
        keywords=["forensic medicine", "toxicology", "medical jurisprudence", "death", "poison"],
    ),

    # --- COMMUNITY MEDICINE / PSM ---
    ReferenceBook(
        title="Park's Textbook of Preventive and Social Medicine",
        authors=["K. Park"],
        publisher="Banarsidas Bhanot Publishers",
        edition="27th Edition",
        subject="community_medicine",
        indian_relevance="THE bible of Community Medicine/PSM in India. Used in every Indian medical college. Essential for MBBS and PG entrance.",
        keywords=["community medicine", "PSM", "epidemiology", "biostatistics", "preventive medicine", "public health", "national health programs", "park"],
    ),

    # --- MEDICINE ---
    ReferenceBook(
        title="Davidson's Principles and Practice of Medicine",
        authors=["Nicholas Boyle", "Stuart H. Ralston"],
        publisher="Elsevier India",
        edition="24th Edition",
        subject="medicine",
        indian_relevance="Standard internal medicine textbook for Indian MBBS clinical years.",
        keywords=["medicine", "internal medicine", "clinical", "diagnosis"],
    ),
    ReferenceBook(
        title="Harrison's Principles of Internal Medicine",
        authors=["J. Larry Jameson", "Anthony S. Fauci"],
        publisher="McGraw Hill India",
        edition="21st Edition",
        subject="medicine",
        indian_relevance="Reference standard for medicine, used for PG preparation in India.",
        keywords=["medicine", "internal medicine", "harrison"],
    ),
    ReferenceBook(
        title="API Textbook of Medicine",
        authors=["Yusuf Merchant"],
        publisher="API / Jaypee Brothers",
        edition="11th Edition",
        subject="medicine",
        indian_relevance="Indian standard medicine textbook, published by Association of Physicians of India.",
        keywords=["medicine", "indian", "API"],
    ),

    # --- SURGERY ---
    ReferenceBook(
        title="Bailey & Love's Short Practice of Surgery",
        authors=["Norman Williams", "Christopher Bulstrode"],
        publisher="CRC Press India",
        edition="28th Edition",
        subject="surgery",
        indian_relevance="Standard surgery textbook for Indian MBBS and MS students.",
        keywords=["surgery", "operative surgery", "clinical surgery"],
    ),
    ReferenceBook(
        title="SRB's Manual of Surgery",
        authors=["S.R. Bailey"],
        publisher="Jaypee Brothers",
        edition="5th Edition",
        subject="surgery",
        indian_relevance="Popular Indian surgery manual for practical and exam preparation.",
        keywords=["surgery", "indian", "manual"],
    ),

    # --- OBSTETRICS & GYNECOLOGY ---
    ReferenceBook(
        title="DC Dutta's Textbook of Obstetrics",
        authors=["D.C. Dutta", "Hiralal Konar"],
        publisher="New Central Book Agency",
        edition="9th Edition",
        subject="obstetrics_gynecology",
        indian_relevance="Standard obstetrics textbook in Indian medical colleges.",
        keywords=["obstetrics", "pregnancy", "labor", "delivery", "antenatal"],
    ),
    ReferenceBook(
        title="Williams Obstetrics",
        authors=["F. Gary Cunningham"],
        publisher="McGraw Hill India",
        edition="26th Edition",
        subject="obstetrics_gynecology",
        indian_relevance="Global gold standard, used as reference in Indian colleges.",
        keywords=["obstetrics", "gynecology"],
    ),

    # --- PEDIATRICS ---
    ReferenceBook(
        title="Ghai's Essential Pediatrics",
        authors=["O.P. Ghai"],
        publisher="CBS Publishers",
        edition="9th Edition",
        subject="pediatrics",
        indian_relevance="Standard pediatrics textbook for Indian MBBS students.",
        keywords=["pediatrics", "children", "growth", "development", "vaccination"],
    ),

    # --- OPHTHALMOLOGY ---
    ReferenceBook(
        title="A.K. Khurana's Comprehensive Ophthalmology",
        authors=["A.K. Khurana"],
        publisher="Jaypee Brothers",
        edition="6th Edition",
        subject="ophthalmology",
        indian_relevance="Standard ophthalmology text for Indian MBBS and PG students.",
        keywords=["ophthalmology", "eye", "vision", "glaucoma", "cataract"],
    ),

    # --- ENT ---
    ReferenceBook(
        title="Dhingra's Diseases of Ear, Nose and Throat",
        authors=["P.L. Dhingra", "Shruti Dhingra"],
        publisher="Jaypee Brothers",
        edition="7th Edition",
        subject="ent",
        indian_relevance="Standard ENT textbook for Indian MBBS students.",
        keywords=["ENT", "ear", "nose", "throat", "sinus"],
    ),

    # --- ORTHOPEDICS ---
    ReferenceBook(
        title="Maheshwari's Textbook of Orthopaedics",
        authors=["A.P. Maheshwari"],
        publisher="Jaypee Brothers",
        edition="5th Edition",
        subject="orthopedics",
        indian_relevance="Standard orthopedics textbook for Indian MBBS students.",
        keywords=["orthopedics", "fractures", "joints", "musculoskeletal"],
    ),

    # --- PSYCHIATRY ---
    ReferenceBook(
        title="Neeraj Ahuja's Textbook of Psychiatry",
        authors=["Neeraj Ahuja"],
        publisher="Jaypee Brothers",
        edition="3rd Edition",
        subject="psychiatry",
        indian_relevance="Standard psychiatry textbook for Indian MBBS students.",
        keywords=["psychiatry", "mental health", "psychology", "behavioral"],
    ),

    # --- DERMATOLOGY ---
    ReferenceBook(
        title="IADVL Textbook of Dermatology",
        authors=["B.S. Narang"],
        publisher="Jaypee Brothers",
        edition="4th Edition",
        subject="dermatology",
        indian_relevance="Official textbook of Indian Association of Dermatologists.",
        keywords=["dermatology", "skin", "hair", "nails"],
    ),

    # --- RADIOLOGY ---
    ReferenceBook(
        title="Sumaira's Textbook of Radiology",
        authors=["Sumaira Ahmed"],
        publisher="Jaypee Brothers",
        edition="3rd Edition",
        subject="radiology",
        indian_relevance="Standard radiology text for Indian medical students.",
        keywords=["radiology", "imaging", "X-ray", "CT", "MRI", "ultrasound"],
    ),

    # --- ANESTHESIA ---
    ReferenceBook(
        title="Ajay Yadav's Textbook of Anaesthesia",
        authors=["Ajay Yadav"],
        publisher="Jaypee Brothers",
        edition="5th Edition",
        subject="anesthesia",
        indian_relevance="Standard anesthesia textbook for Indian MBBS students.",
        keywords=["anesthesia", "analgesia", "pain management", "surgical anesthesia"],
    ),

    # --- EMERGENCY MEDICINE ---
    ReferenceBook(
        title="Fields Emergency Medicine",
        authors=["Judd E. Hollander"],
        publisher="McGraw Hill India",
        edition="3rd Edition",
        subject="emergency_medicine",
        indian_relevance="Used in Indian emergency medicine training programs.",
        keywords=["emergency", "trauma", "critical care", "acute care"],
    ),
]


# ============================================================
# Search by subject
# ============================================================

def get_references_by_subject(subject: str) -> List[ReferenceBook]:
    """Get all reference books for a given subject"""
    return [r for r in INDIAN_MEDICAL_REFERENCES if r.subject == subject.lower()]


def get_references_by_keyword(keyword: str) -> List[ReferenceBook]:
    """Search references by keyword"""
    keyword_lower = keyword.lower()
    results = []
    for ref in INDIAN_MEDICAL_REFERENCES:
        if (keyword_lower in ref.title.lower() or
            keyword_lower in ref.subject.lower() or
            any(keyword_lower in kw for kw in ref.keywords)):
            results.append(ref)
    return results


def get_all_subjects() -> List[str]:
    """Get list of all subjects with references"""
    return list(set(r.subject for r in INDIAN_MEDICAL_REFERENCES))


def get_top_references(subject: str, limit: int = 3) -> List[ReferenceBook]:
    """Get top N references for a subject (ordered by relevance in India)"""
    refs = get_references_by_subject(subject)
    return refs[:limit]


# ============================================================
# Indian Medical University Info
# ============================================================

INDIAN_MEDICAL_UNIVERSITIES = {
    "AIIMS": "All India Institute of Medical Sciences, New Delhi",
    "JIPMER": "Jawaharlal Institute of Postgraduate Medical Education and Research, Puducherry",
    "CMC": "Christian Medical College, Vellore",
    "MAMC": "Maulana Azad Medical College, New Delhi",
    "KGMU": "King George's Medical University, Lucknow",
    "BHU": "Banaras Hindu University Institute of Medical Sciences",
    "UCMS": "University College of Medical Sciences, Delhi",
    "MAHE": "Manipal Academy of Higher Education",
    "JSS": "JSS Medical College, Mysore",
    "MCODS": "MCODS, Manipal",
}

# NEET PG preparation keywords
NEET_PG_TOPICS = [
    "pathology", "pharmacology", "microbiology", "anatomy", "physiology",
    "biochemistry", "forensic medicine", "community medicine", "PSM",
    "medicine", "surgery", "obstetrics", "gynecology", "pediatrics",
    "ophthalmology", "ENT", "orthopedics", "psychiatry", "dermatology",
]


if __name__ == "__main__":
    print(f"Total Indian medical references: {len(INDIAN_MEDICAL_REFERENCES)}")
    print(f"Subjects: {get_all_subjects()}")
    print("\nPharmacology references:")
    for ref in get_references_by_subject("pharmacology"):
        print(f"  - {ref.title} ({ref.edition}) by {', '.join(ref.authors)}")
