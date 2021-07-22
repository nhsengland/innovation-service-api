import { InnovationSupportStatus } from "@domain/index";
import { AccessorModel } from "./AccessorModel";
import { OrganisationUnitModel } from "./OrganisationUnitModel";

export interface InnovationSupportModel {
  id: string;
  status: InnovationSupportStatus;
  accessors?: AccessorModel[];
  organisationUnit?: OrganisationUnitModel;
}
