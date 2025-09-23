// Central compliance package matrix with conditional requirements
export type Requirement = "required" | "optional" | "hidden";

export interface ConditionalFlags {
  hasEmployees: boolean;
  providesConstructionServices: boolean;
  isSokaPflicht: boolean;
  providesAbroad: boolean;
  processesPersonalData: boolean;
}

export interface PackageRule {
  documentTypeId: string;
  baseRequirement: Requirement;
  conditionalRequirement?: {
    condition: keyof ConditionalFlags;
    whenTrue: Requirement;
    whenFalse?: Requirement;
  };
  tooltip?: string;
}

export interface CompliancePackage {
  id: string;
  name: string;
  description: string;
  rules: PackageRule[];
}

export const COMPLIANCE_PACKAGES: CompliancePackage[] = [
  {
    id: "handwerk_basis",
    name: "Handwerk – Basis",
    description: "Grundpaket für Handwerksbetriebe ohne Bauleistungen",
    rules: [
      {
        documentTypeId: "trade_registration",
        baseRequirement: "required",
        tooltip: "Immer erforderlich"
      },
      {
        documentTypeId: "craft_register",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "bg_membership",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "hasEmployees",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Mitarbeitenden"
      },
      {
        documentTypeId: "health_fund_clearance",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "hasEmployees",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Mitarbeitenden"
      },
      {
        documentTypeId: "dpa_gdpr",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "processesPersonalData",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Datenverarbeitung"
      },
      {
        documentTypeId: "liability_insurance",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "tax_clearance",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "safety_instruction",
        baseRequirement: "optional"
      }
    ]
  },
  {
    id: "bau_standard", 
    name: "Bau – Standard",
    description: "Standardpaket für Baubetriebe mit erweiterten Anforderungen",
    rules: [
      {
        documentTypeId: "trade_registration",
        baseRequirement: "required",
        tooltip: "Immer erforderlich"
      },
      {
        documentTypeId: "withholding_certificate_48b",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "providesConstructionServices",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Bauleistungen"
      },
      {
        documentTypeId: "craft_register",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "bg_membership",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "hasEmployees",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Mitarbeitenden"
      },
      {
        documentTypeId: "health_fund_clearance",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "hasEmployees",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Mitarbeitenden"
      },
      {
        documentTypeId: "soka_bau",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "isSokaPflicht",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei SOKA-Pflichtigkeit"
      },
      {
        documentTypeId: "dpa_gdpr",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "processesPersonalData",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Datenverarbeitung"
      },
      {
        documentTypeId: "liability_insurance",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "tax_clearance",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "safety_instruction",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "commercial_register_extract",
        baseRequirement: "optional"
      }
    ]
  },
  {
    id: "ausland_plus",
    name: "Einsatz im Ausland – Plus", 
    description: "Erweiterte Anforderungen für internationale Projekte",
    rules: [
      {
        documentTypeId: "trade_registration",
        baseRequirement: "required",
        tooltip: "Immer erforderlich"
      },
      {
        documentTypeId: "withholding_certificate_48b",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "providesConstructionServices",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Bauleistungen"
      },
      {
        documentTypeId: "craft_register",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "bg_membership",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "hasEmployees",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Mitarbeitenden"
      },
      {
        documentTypeId: "health_fund_clearance",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "hasEmployees",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Mitarbeitenden"
      },
      {
        documentTypeId: "soka_bau",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "isSokaPflicht",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei SOKA-Pflichtigkeit"
      },
      {
        documentTypeId: "a1_certificate",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "providesAbroad",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Entsendung"
      },
      {
        documentTypeId: "dpa_gdpr",
        baseRequirement: "hidden",
        conditionalRequirement: {
          condition: "processesPersonalData",
          whenTrue: "required",
          whenFalse: "hidden"
        },
        tooltip: "Pflicht bei Datenverarbeitung"
      },
      {
        documentTypeId: "liability_insurance",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "tax_clearance",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "safety_instruction",
        baseRequirement: "optional"
      },
      {
        documentTypeId: "commercial_register_extract",
        baseRequirement: "optional"
      }
    ]
  }
];

export function calculateRequirements(
  packageId: string, 
  flags: ConditionalFlags
): Record<string, Requirement> {
  const pkg = COMPLIANCE_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return {};

  const requirements: Record<string, Requirement> = {};

  for (const rule of pkg.rules) {
    let requirement = rule.baseRequirement;
    
    if (rule.conditionalRequirement) {
      const { condition, whenTrue, whenFalse } = rule.conditionalRequirement;
      const conditionValue = flags[condition];
      
      if (conditionValue && whenTrue) {
        requirement = whenTrue;
      } else if (!conditionValue && whenFalse) {
        requirement = whenFalse;
      }
    }
    
    requirements[rule.documentTypeId] = requirement;
  }

  return requirements;
}

export function getPackageById(packageId: string): CompliancePackage | undefined {
  return COMPLIANCE_PACKAGES.find(p => p.id === packageId);
}