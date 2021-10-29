import { OrderByClauseType, OrderByCriteria } from "@services/types";

export function parse(
  orderByInfo: {
    [key: string]: OrderByCriteria;
  },
  mappings: {
    fields: { [key: string]: string };
    defaults: { field: string; direction: string };
  }
): OrderByClauseType[] {
  const result: OrderByClauseType[] = [];

  for (const field in orderByInfo) {
    if (Object.prototype.hasOwnProperty.call(orderByInfo, field)) {
      const direction = orderByInfo[field];
      if (Object.prototype.hasOwnProperty.call(mappings.fields, field)) {
        const mappedField = mappings.fields[field] as string;
        result.push({
          field: mappedField,
          direction,
        });
      }
    }
  }

  if (result.length === 0) {
    const mappedField = mappings.fields[mappings.defaults.field];
    const direction = mappings.defaults.direction;

    result.push({
      field: mappedField,
      direction: direction as OrderByCriteria,
    });
  }

  return result;
}
