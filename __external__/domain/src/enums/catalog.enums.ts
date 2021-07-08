export enum YesOrNoCatalogue {
  YES = "YES",
  NO = "NO",
}

export enum YesPartiallyNoCatalogue {
  YES = "YES",
  PARTIALLY = "PARTIALLY",
  NO = "NO",
}

export enum YesNoNotRelevantCatalogue {
  YES = "YES",
  NO = "NO",
  NOT_RELEVANT = "NOT_RELEVANT",
}

export enum CarePathwayCatalogue {
  ONLY_OPTION = "ONLY_OPTION",
  BETTER_OPTION = "BETTER_OPTION",
  EQUIVALENT_OPTION = "EQUIVALENT_OPTION",
  FIT_LESS_COSTS = "FIT_LESS_COSTS",
  NO_KNOWLEDGE = "NO_KNOWLEDGE",
}

export enum PatientRangeCatalogue {
  UP_10000 = "UP_10000",
  BETWEEN_10000_500000 = "BETWEEN_10000_500000",
  MORE_THAN_500000 = "MORE_THAN_500000",
  NOT_SURE = "NOT_SURE",
  NOT_RELEVANT = "NOT_RELEVANT",
}

export enum CostComparisonCatalogue {
  CHEAPER = "CHEAPER",
  COSTS_MORE_WITH_SAVINGS = "COSTS_MORE_WITH_SAVINGS",
  COSTS_MORE = "COSTS_MORE",
  NOT_SURE = "NOT_SURE",
}

export enum EvidenceTypeCatalogue {
  CLINICAL = "CLINICAL",
  ECONOMIC = "ECONOMIC",
  OTHER = "OTHER",
}

export enum ClinicalEvidenceTypeCatalogue {
  DATA_PUBLISHED = "DATA_PUBLISHED",
  NON_RANDOMISED_COMPARATIVE_DATA = "NON_RANDOMISED_COMPARATIVE_DATA",
  NON_RANDOMISED_NON_COMPARATIVE_DATA = "NON_RANDOMISED_NON_COMPARATIVE_DATA",
  CONFERENCE = "CONFERENCE",
  RANDOMISED_CONTROLLED_TRIAL = "RANDOMISED_CONTROLLED_TRIAL",
  UNPUBLISHED_DATA = "UNPUBLISHED_DATA",
  OTHER = "OTHER",
}

export enum StandardMetCatalogue {
  YES = "YES",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_YET = "NOT_YET",
}

export enum MainPurposeCatalogue {
  PREVENT_CONDITION = "PREVENT_CONDITION",
  PREDICT_CONDITION = "PREDICT_CONDITION",
  DIAGNOSE_CONDITION = "DIAGNOSE_CONDITION",
  MONITOR_CONDITION = "MONITOR_CONDITION",
  PROVIDE_TREATMENT = "PROVIDE_TREATMENT",
  MANAGE_CONDITION = "MANAGE_CONDITION",
  ENABLING_CARE = "ENABLING_CARE",
}

export enum HasProblemTackleKnowledgeCatalogue {
  YES = "YES",
  NOT_YET = "NOT_YET",
  NOT_SURE = "NOT_SURE",
}

export enum HasBenefitsCatalogue {
  YES = "YES",
  NOT_YET = "NOT_YET",
  NOT_SURE = "NOT_SURE",
}

export enum HasEvidenceCatalogue {
  YES = "YES",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_YET = "NOT_YET",
}

export enum HasMarketResearchCatalogue {
  YES = "YES",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_YET = "NOT_YET",
}

export enum HasPatentsCatalogue {
  HAS_AT_LEAST_ONE = "HAS_AT_LEAST_ONE",
  APPLIED_AT_LEAST_ONE = "APPLIED_AT_LEAST_ONE",
  HAS_NONE = "HAS_NONE",
}

export enum HasRegulationKnowledegeCatalogue {
  YES_ALL = "YES_ALL",
  YES_SOME = "YES_SOME",
  NO = "NO",
  NOT_RELEVANT = "NOT_RELEVANT",
}

export enum InnovationPathwayKnowledgeCatalogue {
  PATHWAY_EXISTS_AND_CHANGED = "PATHWAY_EXISTS_AND_CHANGED",
  PATHWAY_EXISTS_AND_FITS = "PATHWAY_EXISTS_AND_FITS",
  NO_PATHWAY = "NO_PATHWAY",
}

export enum HasTestsCatalogue {
  YES = "YES",
  IN_PROCESS = "IN_PROCESS",
  NOT_YET = "NOT_YET",
}

export enum HasKnowledgeCatalogue {
  DETAILED_ESTIMATE = "DETAILED_ESTIMATE",
  ROUGH_IDEA = "ROUGH_IDEA",
  NO = "NO",
}

export enum HasFundingCatalogue {
  YES = "YES",
  NO = "NO",
  NOT_RELEVANT = "NOT_RELEVANT",
}

export enum HasResourcesToScaleCatalogue {
  YES = "YES",
  NO = "NO",
  NOT_SURE = "NOT_SURE",
}

export enum InnovationCategoryCatalogue {
  MEDICAL_DEVICE = "MEDICAL_DEVICE",
  PHARMACEUTICAL = "PHARMACEUTICAL",
  DIGITAL = "DIGITAL",
  AI = "AI",
  EDUCATION = "EDUCATION",
  PPE = "PPE",
  OTHER = "OTHER",
}

export enum InnovationAreaCatalogue {
  COVID_19 = "COVID_19",
  DATA_ANALYTICS_AND_RESEARCH = "DATA_ANALYTICS_AND_RESEARCH",
  DIGITALISING_SYSTEM = "DIGITALISING_SYSTEM",
  IMPROVING_SYSTEM_FLOW = "IMPROVING_SYSTEM_FLOW",
  INDEPENDENCE_AND_PREVENTION = "INDEPENDENCE_AND_PREVENTION",
  OPERATIONAL_EXCELLENCE = "OPERATIONAL_EXCELLENCE",
  PATIENT_ACTIVATION_AND_SELF_CARE = "PATIENT_ACTIVATION_AND_SELF_CARE",
  PATIENT_SAFETY = "PATIENT_SAFETY",
  WORKFORCE_OPTIMISATION = "WORKFORCE_OPTIMISATION",
}

export enum InnovationClinicalAreaCatalogue {
  ACUTE = "ACUTE",
  AGEING = "AGEING",
  CANCER = "CANCER",
  CARDIO_ENDOCRINE_METABOLIC = "CARDIO_ENDOCRINE_METABOLIC",
  CHILDREN_AND_YOUNG = "CHILDREN_AND_YOUNG",
  DISEASE_AGNOSTIC = "DISEASE_AGNOSTIC",
  GASTRO_KDNEY_LIVER = "GASTRO_KDNEY_LIVER",
  INFECTION_INFLAMATION = "INFECTION_INFLAMATION",
  MATERNITY_REPRODUCTIVE_HEALTH = "MATERNITY_REPRODUCTIVE_HEALTH",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  NEUROLOGY = "NEUROLOGY",
  POPULATION_HEALTH = "POPULATION_HEALTH",
  RESPIRATORY = "RESPIRATORY",
  UROLOGY = "UROLOGY",
  WORKFORCE_AND_EDUCATION = "WORKFORCE_AND_EDUCATION",
}

export enum InnovationCareSettingCatalogue {
  AMBULANCE_OR_PARAMEDIC = "AMBULANCE_OR_PARAMEDIC",
  COMMUNITY = "COMMUNITY",
  HOSPITAL_INPATIENT = "HOSPITAL_INPATIENT",
  HOSPITAL_OUTPATIENT = "HOSPITAL_OUTPATIENT",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  PATIENT_HOME = "PATIENT_HOME",
  PHARMACY = "PHARMACY",
  PRIMARY_CARE = "PRIMARY_CARE",
  SOCIAL_CARE = "SOCIAL_CARE",
}

export enum InnovationRevenueTypeCatalogue {
  ADVERTISING = "ADVERTISING",
  DIRECT_PRODUCT_SALES = "DIRECT_PRODUCT_SALES",
  FEE_FOR_SERVICE = "FEE_FOR_SERVICE",
  LEASE = "LEASE",
  SALES_OF_CONSUMABLES_OR_ACCESSORIES = "SALES_OF_CONSUMABLES_OR_ACCESSORIES",
  SUBSCRIPTION = "SUBSCRIPTION",
  OTHER = "OTHER",
}

export enum InnovationCertificationCatalogue {
  CE_UKCA_NON_MEDICAL = "CE_UKCA_NON_MEDICAL",
  CE_UKCA_CLASS_I = "CE_UKCA_CLASS_I",
  CE_UKCA_CLASS_II_A = "CE_UKCA_CLASS_II_A",
  CE_UKCA_CLASS_II_B = "CE_UKCA_CLASS_II_B",
  CE_UKCA_CLASS_III = "CE_UKCA_CLASS_III",
  IVD_GENERAL = "IVD_GENERAL",
  IVD_SELF_TEST = "IVD_SELF_TEST",
  IVD_ANNEX_LIST_A = "IVD_ANNEX_LIST_A",
  IVD_ANNEX_LIST_B = "IVD_ANNEX_LIST_B",
  MARKETING = "MARKETING",
  CQC = "CQC",
  DTAC = "DTAC",
  OTHER = "OTHER",
}

export enum InnovationSupportTypeCatalogue {
  ASSESSMENT = "ASSESSMENT",
  PRODUCT_MIGRATION = "PRODUCT_MIGRATION",
  CLINICAL_TESTS = "CLINICAL_TESTS",
  COMMERCIAL = "COMMERCIAL",
  PROCUREMENT = "PROCUREMENT",
  DEVELOPMENT = "DEVELOPMENT",
  EVIDENCE_EVALUATION = "EVIDENCE_EVALUATION",
  FUNDING = "FUNDING",
  INFORMATION = "INFORMATION",
}

export enum MaturityLevelCatalogue {
  DISCOVERY = "DISCOVERY",
  ADVANCED = "ADVANCED",
  READY = "READY",
}

export enum GeneralBenefitCatalogue {
  REDUCE_LENGTH_STAY = "REDUCE_LENGTH_STAY",
  REDUCE_CRITICAL_CARE = "REDUCE_CRITICAL_CARE",
  REDUCE_EMERGENCY_ADMISSIONS = "REDUCE_EMERGENCY_ADMISSIONS",
  CHANGES_DELIVERY_SECONDARY_TO_PRIMARY = "CHANGES_DELIVERY_SECONDARY_TO_PRIMARY",
  CHANGES_DELIVERY_INPATIENT_TO_DAY_CASE = "CHANGES_DELIVERY_INPATIENT_TO_DAY_CASE",
  INCREASES_COMPLIANCE = "INCREASES_COMPLIANCE",
  IMPROVES_COORDINATION = "IMPROVES_COORDINATION",
  REDUCES_REFERRALS = "REDUCES_REFERRALS",
  LESS_TIME = "LESS_TIME",
  FEWER_STAFF = "FEWER_STAFF",
  FEWER_APPOINTMENTS = "FEWER_APPOINTMENTS",
  COST_SAVING = "COST_SAVING",
  INCREASES_EFFICIENCY = "INCREASES_EFFICIENCY",
  IMPROVES_PERFORMANCE = "IMPROVES_PERFORMANCE",
  OTHER = "OTHER",
}

export enum EnvironmentalBenefitCatalogue {
  NO_SIGNIFICANT_BENEFITS = "NO_SIGNIFICANT_BENEFITS",
  LESS_ENERGY = "LESS_ENERGY",
  LESS_RAW_MATERIALS = "LESS_RAW_MATERIALS",
  REDUCES_GAS_EMISSIONS = "REDUCES_GAS_EMISSIONS",
  REDUCES_PLASTICS_USE = "REDUCES_PLASTICS_USE",
  MINIMISES_WASTE = "MINIMISES_WASTE",
  LOWER_ENVIRONMENTAL_IMPACT = "LOWER_ENVIRONMENTAL_IMPACT",
  OPTIMIZES_FINITE_RESOURCE_USE = "OPTIMIZES_FINITE_RESOURCE_USE",
  USES_RECYCLED_MATERIALS = "USES_RECYCLED_MATERIALS",
  OTHER = "OTHER",
}

export enum SubgroupBenefitCatalogue {
  REDUCE_MORTALITY = "REDUCE_MORTALITY",
  REDUCE_FURTHER_TREATMENT = "REDUCE_FURTHER_TREATMENT",
  REDUCE_ADVERSE_EVENTS = "REDUCE_ADVERSE_EVENTS",
  ENABLE_EARLIER_DIAGNOSIS = "ENABLE_EARLIER_DIAGNOSIS",
  REDUCE_RISKS = "REDUCE_RISKS",
  PREVENTS_CONDITION_OCCURRING = "PREVENTS_CONDITION_OCCURRING",
  AVOIDS_UNNECESSARY_TREATMENT = "AVOIDS_UNNECESSARY_TREATMENT",
  ENABLES_NON_INVASIVELY_TEST = "ENABLES_NON_INVASIVELY_TEST",
  INCREASES_SELF_MANAGEMENT = "INCREASES_SELF_MANAGEMENT",
  INCREASES_LIFE_QUALITY = "INCREASES_LIFE_QUALITY",
  ENABLES_SHARED_CARE = "ENABLES_SHARED_CARE",
  OTHER = "OTHER",
}
