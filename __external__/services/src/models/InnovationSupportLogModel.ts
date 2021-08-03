import { OrganisationUnitModel } from "./OrganisationUnitModel";

export interface InnovationSupportLogModel {
  id: string;
  type: string;
  description: string;
  innovationSupportStatus: string;
  createdBy: string;
  createdAt: Date;
  organisationUnit?: OrganisationUnitModel;
  suggestedOrganisationUnits?: OrganisationUnitModel[];
}
