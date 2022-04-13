import { OrganisationUser, UserRole, UserType } from "@domain/index";

export type OrderByCriteria = "ASC" | "DESC";
export type OrderByClauseType = {
  field: string;
  direction: OrderByCriteria;
};

export enum SupportFilter {
  UNASSIGNED = "UNASSIGNED",
  ENGAGING = "ENGAGING",
  NOT_ENGAGING = "NOT_ENGAGING",
}
export type UserSearchResult = {
  id: string;
  displayName: string;
  type: UserType;
  email: string;
  lockedAt?: Date;
  userOrganisations: {
    id: string;
    name: string;
    role: string;
    units: {
      id: string;
      name: string;
    }[];
  }[];
  serviceRoles?: UserRole[];
};

export enum SLSEventType {
  LOGIN = "LOGIN",
  ADMIN_HEALTH = "ADMIN_HEALTH",
  ADMIN_CREATE_USER = "ADMIN_CREATE_USER",
  ADMIN_LOCK_USER = "ADMIN_LOCK_USER",
  ADMIN_UNLOCK_USER = "ADMIN_UNLOCK_USER",
  ADMIN_SEARCH_USER = "ADMIN_SEARCH_USER",
  ADMIN_LOCK_VALIDATION = "ADMIN_LOCK_VALIDATION",
  ADMIN_UPDATE_USER = "ADMIN_UPDATE_USER",
  ADMIN_UPDATE_ORGANISATION = "ADMIN_UPDATE_ORGANISATION",
  ADMIN_UPDATE_ORGANISATION_UNIT = "ADMIN_UPDATE_ORGANISATION_UNIT",
  ADMIN_UPDATE_USER_ORGANISATION_UNIT = "ADMIN_UPDATE_USER_ORGANISATION_UNIT",
}

export enum UserLockValidationCode {
  LastAssessmentUserOnPlatform = "lastAssessmentUserOnPlatform",
  LastAccessorUserOnOrganisation = "lastAccessorUserOnOrganisation",
  LastAccessorUserOnOrganisationUnit = "lastAccessorUserOnOrganisationUnit",
  LastAccessorFromUnitProvidingSupport = "lastAccessorFromUnitProvidingSupport",
}

export enum UserChangeRoleValidationCode {
  LastAccessorUserOnOrganisationUnit = "lastAccessorUserOnOrganisationUnit",
}
