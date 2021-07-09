export enum OrganisationType {
  INNOVATOR = "INNOVATOR",
  ACCESSOR = "ACCESSOR",
}

export enum AccessorOrganisationRole {
  ACCESSOR = "ACCESSOR",
  QUALIFYING_ACCESSOR = "QUALIFYING_ACCESSOR",
}

export enum InnovatorOrganisationRole {
  INNOVATOR_OWNER = "INNOVATOR_OWNER",
}

export type OrganisationUserRole =
  | AccessorOrganisationRole
  | InnovatorOrganisationRole;
