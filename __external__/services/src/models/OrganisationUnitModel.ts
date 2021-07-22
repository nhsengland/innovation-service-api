import { OrganisationModel } from "./OrganisationModel";

export interface OrganisationUnitModel {
  id: string;
  name: string;
  acronym?: string;
  organisation?: OrganisationModel;
}
