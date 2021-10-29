export type OrderByCriteria = "ASC" | "DESC";
export type OrderByClauseType = {
  field: string;
  direction: OrderByCriteria;
};
