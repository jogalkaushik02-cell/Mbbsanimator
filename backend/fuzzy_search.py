"""
Fuzzy Search Module - Handles spelling mistakes and approximate matching
Uses difflib for lightweight fuzzy matching without external dependencies
"""

from difflib import SequenceMatcher, get_close_matches
from typing import List, Tuple, Optional
import re


# Common medical term misspellings (Indian student patterns)
MEDICAL_MISSPELLINGS = {
    "phagocytosis": ["phagocytosys", "phagocytis", "phagocytis", "phagocytocis", "fagocytosis"],
    "pathogenesis": ["pathogenisis", "pathogensesis", "pathogensis", "pathogenesys"],
    "myocardial infarction": ["myocardial infartion", "miocardial infarction", "myocardial infrction"],
    "hypertension": ["hypertention", "hupertension", "hipertension"],
    "diabetes": ["diabetis", "diabities", "diabetese"],
    "pneumonia": ["pneumonia", "pnumonia", "pneummonia"],
    "tuberculosis": ["tuberculoses", "tuberculocis", "tuberclosis"],
    "carcinoma": ["carcinoma", "carcinomia", "karcinoma"],
    "atherosclerosis": ["atherosclerosis", "atherosclerosis", "artherosclerosis"],
    "pharmacology": ["pharmacology", "pharamcology", "pharmocology"],
    "immunology": ["immunology", "immunolgy", "immnology"],
    "histology": ["histology", "histolgy", "histologoy"],
    "embryology": ["embryology", "embryolgy", "embryoloy"],
    "biochemistry": ["biochemistry", "biochemsitry", "biochemestry"],
    "physiology": ["physiology", "physioloy", "physiologoy"],
    "anatomy": ["anatomy", "anatmy", "anatomoy"],
    "pathology": ["pathology", "patholgy", "patholoy"],
    "microbiology": ["microbiology", "microbiolgy", "microbioloy"],
    "forensic": ["forensic", "forensik", "forrensic"],
    "dermatology": ["dermatology", "dermatolgy", "dermitology"],
    "ophthalmology": ["ophthalmology", "ophthalmoloy", "ophalmology"],
    "orthopedics": ["orthopedics", "orthopaedics", "orthopadics"],
    "psychiatry": ["psychiatry", "psychiatri", "psychatry"],
    "cardiovascular": ["cardiovascular", "cardiovasculer", "cardivascular"],
    "gastrointestinal": ["gastrointestinal", "gastrointesinal", "gastrointenstinal"],
    "respiratory": ["respiratory", "respiratoy", "respitaroy"],
    "neurology": ["neurology", "neurolgy", "neuroloy"],
    "oncology": ["oncology", "oncolgy", "onclolgy"],
    "immunodeficiency": ["immunodeficiency", "immunodeficiancy", "immunodefeciency"],
    "inflammation": ["inflammation", "inflamation", "inflamtion"],
    "apoptosis": ["apoptosis", "appoptosis", "apoptosys"],
    "mitochondria": ["mitochondria", "mitochondrea", "mitocondria"],
    "ribosome": ["ribosome", "ribosom", "ribosomme"],
    "endoplasmic reticulum": ["endoplasmic reticulum", "endoplasmic reticulum", "endoplsmic reticulum"],
    "nucleus": ["nucleus", "nucleos", "nuckeus"],
    "cytoplasm": ["cytoplasm", "cytoplasma", "cytoplasium"],
    "membrane": ["membrane", "membrand", "membraine"],
    "receptor": ["receptor", "receopter", "receptar"],
    "enzyme": ["enzyme", "enzime", "enzymme"],
    "protein": ["protein", "protien", "protine"],
    "antibody": ["antibody", "antibodie", "antibodi"],
    "antigen": ["antigen", "antigene", "antigan"],
    "vaccine": ["vaccine", "vaccin", "vacciene"],
    "bacteria": ["bacteria", "bacteri", "bakteria"],
    "virus": ["virus", "viris", "viurus"],
    "parasite": ["parasite", "parasit", "paracite"],
    "fungus": ["fungus", "fungis", "fungal"],
    "epidemiology": ["epidemiology", "epidemolgy", "epidemioloy"],
    "biostatistics": ["biostatistics", "biostatistcs", "biostatiscs"],
    "therapeutics": ["therapeutics", "theraputics", "therapetics"],
    "surgery": ["surgery", "surjery", "surgeri"],
    "anesthesia": ["anesthesia", "anaesthesia", "anestesia"],
    "cesarean": ["cesarean", "caesarean", "cesarian"],
    "gestation": ["gestation", "gestatoin", "gestashun"],
    "prenatal": ["prenatal", "pre-natal", "preantal"],
    "postnatal": ["postnatal", "post-natal", "postantal"],
    "abortion": ["abortion", "aborshun", "abortin"],
    "contraception": ["contraception", "contracepshun", "contraceptin"],
    "menstruation": ["menstruation", "menstruashun", "mensturation"],
    "ovulation": ["ovulation", "ovulashun", "ovultion"],
    "fertilization": ["fertilization", "fertilisashun", "fertalization"],
    "erythrocyte": ["erythrocyte", "erythrocyt", "erithrocyte"],
    "leukocyte": ["leukocyte", "leucocyte", "leukocyt"],
    "thrombocyte": ["thrombocyte", "thrombocyt", "trombocyte"],
    "hemoglobin": ["hemoglobin", "haemoglobin", "hemoglubin"],
    "plasma": ["plasma", "plazma", "plasm"],
    "serum": ["serum", "sereum", "sirum"],
    "glucose": ["glucose", "glukose", "glocose"],
    "insulin": ["insulin", "insuline", "insulen"],
    "lipid": ["lipid", "lipide", "lipit"],
    "cholesterol": ["cholesterol", "kolesterol", "cholstrol"],
    "triglyceride": ["triglyceride", "triglycerid", "trigliseride"],
    "amino acid": ["amino acid", "aminoacid", "amino asid"],
    "nucleic acid": ["nucleic acid", "nucleicacid", "nukleic acid"],
    "dna": ["dna", "d.n.a", "deoxyribonucleic acid"],
    "rna": ["rna", "r.n.a", "ribonucleic acid"],
    "transcription": ["transcription", "transcripshun", "transcription"],
    "translation": ["translation", "translashun", "translation"],
    "replication": ["replication", "replicashun", "replication"],
    "mutation": ["mutation", "mutashun", "mewtation"],
    "chromosome": ["chromosome", "chromosom", "chromazome"],
    "gene": ["gene", "gen", "jean"],
    "allele": ["allele", "allel", "aliele"],
    "genotype": ["genotype", "genotyp", "geno-type"],
    "phenotype": ["phenotype", "phenotyp", "pheno-type"],
    "mitosis": ["mitosis", "mitosys", "mytosis"],
    "meiosis": ["meiosis", "meiosys", "miosis"],
}


def correct_spelling(query: str) -> str:
    """Correct common medical spelling mistakes - handles multi-word queries"""
    words = query.lower().strip().split()
    corrected_words = []

    for word in words:
        corrected = _correct_single_word(word)
        corrected_words.append(corrected)

    return " ".join(corrected_words)


def _correct_single_word(word: str) -> str:
    """Correct a single word"""
    # Direct match
    if word in MEDICAL_MISSPELLINGS:
        return word

    # Check each misspelling variant
    for correct, misspellings in MEDICAL_MISSPELLINGS.items():
        if word in misspellings:
            return correct

    # Fuzzy match against all known terms (higher cutoff = more conservative)
    all_terms = list(MEDICAL_MISSPELLINGS.keys())
    matches = get_close_matches(word, all_terms, n=1, cutoff=0.75)
    if matches:
        return matches[0]

    # Check against misspelling values
    for correct, misspellings in MEDICAL_MISSPELLINGS.items():
        close = get_close_matches(word, misspellings, n=1, cutoff=0.75)
        if close:
            return correct

    return word  # Return original if no correction found


def fuzzy_search(query: str, candidates: List[str], threshold: float = 0.5) -> List[Tuple[str, float]]:
    """Fuzzy search with similarity scores"""
    results = []
    query_lower = query.lower()

    for candidate in candidates:
        candidate_lower = candidate.lower()
        # Exact substring match
        if query_lower in candidate_lower or candidate_lower in query_lower:
            results.append((candidate, 1.0))
            continue

        # SequenceMatcher ratio
        ratio = SequenceMatcher(None, query_lower, candidate_lower).ratio()
        if ratio >= threshold:
            results.append((candidate, ratio))

    results.sort(key=lambda x: x[1], reverse=True)
    return results


def expand_query(query: str) -> List[str]:
    """Expand a query with common medical synonyms"""
    expanded = [query]

    corrections = correct_spelling(query)
    if corrections != query.lower():
        expanded.append(corrections)

    # Add subject-specific expansions
    medical_expansions = {
        "heart": ["cardiac", "cardiovascular", "myocardium"],
        "lung": ["pulmonary", "respiratory", "pulmonology"],
        "brain": ["cerebral", "neurological", "neuroscience"],
        "kidney": ["renal", "nephrology", "nephron"],
        "liver": ["hepatic", "hepatology", "hepatocyte"],
        "stomach": ["gastric", "gastrointestinal", "gastritis"],
        "bone": ["skeletal", "orthopedic", "osseous"],
        "blood": ["hematological", "hematology", "vascular"],
        "skin": ["dermatological", "dermatology", "cutaneous"],
        "eye": ["ocular", "ophthalmological", "ophthalmology"],
        "ear": ["auditory", "otological", "otology"],
    }

    query_lower = query.lower()
    for term, expansions in medical_expansions.items():
        if term in query_lower:
            expanded.extend(expansions)

    return list(set(expanded))


def get_search_suggestions(query: str) -> List[str]:
    """Get search suggestions for misspelled queries"""
    corrected = correct_spelling(query)
    suggestions = [corrected]

    if corrected != query.lower():
        suggestions.append(f"{corrected} mechanism")
        suggestions.append(f"{corrected} pathology")
        suggestions.append(f"{corrected} treatment")
        suggestions.append(f"{corrected} Indian textbook")

    return suggestions


if __name__ == "__main__":
    # Test spelling correction
    test_queries = [
        "phagocytosys",
        "pathogenisis",
        "pharamcology",
        "robbins",
        "park community medicine",
        "phagocytosis",
        "hypertention",
        "diabetis",
    ]

    for q in test_queries:
        corrected = correct_spelling(q)
        suggestions = get_search_suggestions(q)
        print(f"'{q}' -> '{corrected}' | Suggestions: {suggestions[:3]}")
