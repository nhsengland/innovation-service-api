import { OrganisationUnitModel } from "./OrganisationUnitModel";

export interface OrganisationModel {
  id: string;
  name: string;
  acronym?: string;
  organisationUnits?: OrganisationUnitModel[];
}
