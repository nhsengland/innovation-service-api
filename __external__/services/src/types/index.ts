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
