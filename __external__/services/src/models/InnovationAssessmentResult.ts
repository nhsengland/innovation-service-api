import { OrganisationModel } from "./OrganisationModel";

export interface InnovationAssessmentResult {
  id: string;
  description: string;
  summary?: string;
  maturityLevel?: string;
  hasRegulatoryApprovals?: string;
  hasRegulatoryApprovalsComment?: string;
  hasEvidence?: string;
  hasEvidenceComment?: string;
  hasValidation?: string;
  hasValidationComment?: string;
  hasProposition?: string;
  hasPropositionComment?: string;
  hasCompetitionKnowledge?: string;
  hasCompetitionKnowledgeComment?: string;
  hasImplementationPlan?: string;
  hasImplementationPlanComment?: string;
  hasScaleResource?: string;
  hasScaleResourceComment?: string;
  finishedAt?: Date;
  assignToName: string;
  innovation: {
    id: string;
    name: string;
  };
  organisations: OrganisationModel[];
}
