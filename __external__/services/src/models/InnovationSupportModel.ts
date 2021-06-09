import { InnovationSupportStatus } from "@domain/index";
import { OrganisationUnitUserModel } from "./OrganisationUnitUserModel";

export interface InnovationSupportModel {
  id: string;
  status: InnovationSupportStatus;
  accessors: OrganisationUnitUserModel[];
}
