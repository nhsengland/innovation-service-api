export interface OrganisationModelWithUsers {
  id: string;
  name: string;
  acronym?: string;
  organisationUnits: OrganisationUnitsWithUsers[];
}

export interface OrganisationUnitsWithUsers {
  id: string;
  name: string;
  acronym: string;
  organisationUnitUsers: OrganisationUnitUsers[];
}

export interface OrganisationUnitUsers {
  id: string;
  displayName: string;
  role: string;
}
