import { AccessorOrganisationRole, UserType } from "@domain/index";

export interface UserCreationModel {
  type: UserType;
  name: string;
  email: string;
  password?: string;
  organisationAcronym?: string;
  organisationUnitAcronym?: string;
  role?: AccessorOrganisationRole;
}
