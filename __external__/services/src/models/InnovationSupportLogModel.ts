import { OrganisationUnitModel } from "./OrganisationUnitModel";

export interface InnovationSupportLogModel {
  id: string;
  type: string;
  description: string;
  innovationSupportStatus: string;
  createdBy: string;
  organisationUnit?: OrganisationUnitModel;
  suggestedOrganisationUnits?: OrganisationUnitModel[];
}
