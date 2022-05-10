import { OrganisationUserRole, UserType } from "@domain/index";

export interface RequestUser {
  id: string;
  externalId: string;
  type: UserType;
  organisationUser?: {
    id: string;
    role: OrganisationUserRole;
    organisation: {
      id: string;
      name: string;
    };
  };
  organisationUnitUser?: {
    id: string;
    organisationUnit: {
      id: string;
      name: string;
    };
  };
}
