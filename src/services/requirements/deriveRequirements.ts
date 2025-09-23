import { ConditionalAnswers } from '@/config/conditionalQuestions';

export type Requirement = "required" | "optional" | "hidden";

export interface RequirementMap {
  [docType: string]: Requirement;
}

export interface OrgFlags {
  hrRegistered?: boolean;
}

// Mapping zwischen unserem System und den docType-Schlüsseln
const DOC_TYPE_MAPPING = {
  'GEWERBEANMELDUNG': 'gewerbeanmeldung',
  'BETRIEBSHAFTPFLICHT': 'haftpflicht',
  'FREISTELLUNGSBESCHEINIGUNG': 'freistellungsbescheinigung',
  'BG_MITGLIEDSCHAFT': 'bg_mitgliedschaft',
  'HR_AUSZUG': 'hr_auszug',
  'KK_UNBEDENKLICHKEIT': 'kk_unbedenklichkeit',
  'AVV': 'avv',
  'A1_BESCHEINIGUNG': 'a1_bescheinigung',
  'SOKA_BAU': 'soka_bau',
  'SICHERHEITSUNTERWEISUNG': 'sicherheitsunterweisung',
} as const;

export function deriveRequirements(
  answers: ConditionalAnswers,
  orgFlags: OrgFlags = {}
): RequirementMap {
  const requirements: RequirementMap = {};

  // Basis (immer sichtbar)
  requirements[DOC_TYPE_MAPPING.GEWERBEANMELDUNG] = "required";
  requirements[DOC_TYPE_MAPPING.BETRIEBSHAFTPFLICHT] = "required";

  // HR-Auszug abhängig von Handelsregistereintragung
  requirements[DOC_TYPE_MAPPING.HR_AUSZUG] = orgFlags.hrRegistered === true ? "required" : "hidden";

  // Q1 – hasEmployees
  const hasEmployees = answers.hasEmployees;
  
  if (hasEmployees === "yes") {
    requirements[DOC_TYPE_MAPPING.BG_MITGLIEDSCHAFT] = "required";
    requirements[DOC_TYPE_MAPPING.KK_UNBEDENKLICHKEIT] = "optional";
    
    // Sicherheitsunterweisung abhängig von Q2
    if (answers.doesConstructionWork === "yes") {
      requirements[DOC_TYPE_MAPPING.SICHERHEITSUNTERWEISUNG] = "required";
    } else {
      requirements[DOC_TYPE_MAPPING.SICHERHEITSUNTERWEISUNG] = "optional";
    }
  } else if (hasEmployees === "no") {
    requirements[DOC_TYPE_MAPPING.BG_MITGLIEDSCHAFT] = "hidden";
    requirements[DOC_TYPE_MAPPING.KK_UNBEDENKLICHKEIT] = "hidden";
    requirements[DOC_TYPE_MAPPING.SICHERHEITSUNTERWEISUNG] = "hidden";
  } else { // unknown
    requirements[DOC_TYPE_MAPPING.BG_MITGLIEDSCHAFT] = "optional";
    requirements[DOC_TYPE_MAPPING.KK_UNBEDENKLICHKEIT] = "optional";
    requirements[DOC_TYPE_MAPPING.SICHERHEITSUNTERWEISUNG] = "optional";
  }

  // Q2 – doesConstructionWork (Bauleistungen)
  const doesConstructionWork = answers.doesConstructionWork;
  
  if (doesConstructionWork === "yes") {
    requirements[DOC_TYPE_MAPPING.FREISTELLUNGSBESCHEINIGUNG] = "required";
    
    // BG bei unknown auf required heben, wenn Bauleistungen
    if (hasEmployees === "unknown") {
      requirements[DOC_TYPE_MAPPING.BG_MITGLIEDSCHAFT] = "required";
    }
  } else if (doesConstructionWork === "no") {
    requirements[DOC_TYPE_MAPPING.FREISTELLUNGSBESCHEINIGUNG] = "optional";
    
    // Sicherheitsunterweisung auf optional setzen (falls Q1 yes)
    if (hasEmployees === "yes") {
      requirements[DOC_TYPE_MAPPING.SICHERHEITSUNTERWEISUNG] = "optional";
    }
  } else { // unknown
    requirements[DOC_TYPE_MAPPING.FREISTELLUNGSBESCHEINIGUNG] = "optional";
  }

  // Q2a – sokaBauSubject (nur sichtbar wenn Q2=yes)
  const sokaBauSubject = answers.sokaBauSubject;
  
  if (doesConstructionWork === "yes") {
    if (sokaBauSubject === "yes") {
      requirements[DOC_TYPE_MAPPING.SOKA_BAU] = "required";
    } else if (sokaBauSubject === "no") {
      requirements[DOC_TYPE_MAPPING.SOKA_BAU] = "hidden";
    } else { // unknown
      requirements[DOC_TYPE_MAPPING.SOKA_BAU] = "optional";
    }
  } else {
    // SOKA automatisch hidden wenn keine Bauleistungen
    requirements[DOC_TYPE_MAPPING.SOKA_BAU] = "hidden";
  }

  // Q3 – sendsAbroad (Entsendung EU/EWR/CH)
  const sendsAbroad = answers.sendsAbroad;
  
  if (sendsAbroad === "yes") {
    requirements[DOC_TYPE_MAPPING.A1_BESCHEINIGUNG] = "required";
  } else if (sendsAbroad === "no") {
    requirements[DOC_TYPE_MAPPING.A1_BESCHEINIGUNG] = "hidden";
  } else { // unknown
    requirements[DOC_TYPE_MAPPING.A1_BESCHEINIGUNG] = "optional";
  }

  // Q4 – processesPersonalData (AVV)
  const processesPersonalData = answers.processesPersonalData;
  
  if (processesPersonalData === "yes") {
    requirements[DOC_TYPE_MAPPING.AVV] = "required";
  } else if (processesPersonalData === "no") {
    requirements[DOC_TYPE_MAPPING.AVV] = "hidden";
  } else { // unknown
    requirements[DOC_TYPE_MAPPING.AVV] = "optional";
  }

  return requirements;
}

// Hilfsfunktion für Reverse-Mapping (falls nötig)
export function getDocTypeByKey(key: string): string | undefined {
  const entry = Object.entries(DOC_TYPE_MAPPING).find(([_, value]) => value === key);
  return entry ? entry[0] : undefined;
}

// Hilfsfunktion um zu prüfen ob ein Dokument "uncertain" ist (unknown-Fall)
export function isDocumentUncertain(
  docType: string, 
  answers: ConditionalAnswers, 
  requirements: RequirementMap
): boolean {
  const requirement = requirements[docType];
  if (requirement !== "optional") return false;

  // Prüfe ob das Dokument wegen "unknown" optional ist
  const reverseDocType = getDocTypeByKey(docType);
  if (!reverseDocType) return false;

  switch (reverseDocType) {
    case 'BG_MITGLIEDSCHAFT':
    case 'KK_UNBEDENKLICHKEIT':
    case 'SICHERHEITSUNTERWEISUNG':
      return answers.hasEmployees === "unknown";
    
    case 'FREISTELLUNGSBESCHEINIGUNG':
      return answers.doesConstructionWork === "unknown";
    
    case 'SOKA_BAU':
      return answers.sokaBauSubject === "unknown" && answers.doesConstructionWork === "yes";
    
    case 'A1_BESCHEINIGUNG':
      return answers.sendsAbroad === "unknown";
    
    case 'AVV':
      return answers.processesPersonalData === "unknown";
    
    default:
      return false;
  }
}

// Hilfsfunktion um fehlende Pflicht-Dokumente zu ermitteln
export function getMissingRequiredDocuments(
  requirements: RequirementMap,
  currentDocuments: { [docType: string]: { status: string } }
): string[] {
  const missing: string[] = [];
  
  for (const [docType, requirement] of Object.entries(requirements)) {
    if (requirement === "required") {
      const doc = currentDocuments[docType];
      if (!doc || ['missing', 'rejected', 'expired'].includes(doc.status)) {
        missing.push(docType);
      }
    }
  }
  
  return missing;
}