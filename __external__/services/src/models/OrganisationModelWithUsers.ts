export interface OrganisationModelWithUsers {
  id: string;
  name: string;
  acronym?: string;
  organisationUnits?: {
    id: string;
    name: string;
    acronym: string;
    unitUsers: {
      id: string;
      name: string;
      role: string;
    }[];
  }[];
}
