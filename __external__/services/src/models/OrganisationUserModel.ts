import { OrganisationUnitModel } from "./OrganisationUnitModel";

export interface OrganisationUserModel {
  id: string;
  role: string;
  name: string;
  isShadow: boolean;
  size?: string;
  organisationUnits: OrganisationUnitModel[];
}
