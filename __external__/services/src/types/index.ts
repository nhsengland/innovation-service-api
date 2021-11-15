import { OrganisationUser } from "@domain/index";

export type OrderByCriteria = "ASC" | "DESC";
export type OrderByClauseType = {
  field: string;
  direction: OrderByCriteria;
};

export enum SupportFilter {
  UNASSIGNED,
  ENGAGING,
  NOT_ENGAGING,
}
export type UserSearchResult = {
  id: string;
  displayName: string;
  userOrganisations: OrganisationUser[];
};
