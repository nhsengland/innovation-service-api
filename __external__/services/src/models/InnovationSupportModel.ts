import { InnovationSupportStatus } from "@domain/index";
import { AccessorModel } from "./AccessorModel";
import { OrganisationModel } from "./OrganisationModel";
import { OrganisationUnitUserModel } from "./OrganisationUnitUserModel";

export interface InnovationSupportModel {
  id: string;
  status: InnovationSupportStatus;
  accessors: AccessorModel[];
  organisation?: OrganisationModel;
  organisationUnit?: OrganisationUnitUserModel;
}
