import { Innovation, User } from "@domain/index";
import { OrganisationModel } from "./OrganisationModel";

export interface InnovationAssessmentResult {
  id: string;
  description: string;
  summary?: string;
  maturityLevel?: string;
  hasRegulatoryApprovals?: string;
  hasRegulatoryApprovalsComment?: string;

  assignTo: User;
  innovation: Innovation;
  organisations: OrganisationModel[];
}
