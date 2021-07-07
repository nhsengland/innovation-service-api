import { DefaultNamingStrategy, Table, NamingStrategyInterface } from "typeorm";

export class CustomNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    referencedTablePath?: string
  ): string {
    tableOrName =
      typeof tableOrName === "string" ? tableOrName : tableOrName.name;

    const name = columnNames.reduce(
      (name, column) => `${name}_${column}`,
      `${referencedTablePath}`
    );

    return `fk_${tableOrName}_${name}`;
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    tableOrName =
      typeof tableOrName === "string" ? tableOrName : tableOrName.name;

    const name = columnNames.reduce((name, column) => `${name}_${column}`);

    return `pk_${tableOrName}_${name}`;
  }

  indexName(tableOrName: Table | string, columns: string[]): string {
    tableOrName =
      typeof tableOrName === "string" ? tableOrName : tableOrName.name;

    const name = columns.reduce(
      (name, column) => `${name}_${column}`,
      `${tableOrName}`
    );

    return `idx_${name}`;
  }

  defaultConstraintName(
    tableOrName: Table | string,
    columnName: string
  ): string {
    tableOrName =
      typeof tableOrName === "string" ? tableOrName : tableOrName.name;

    return `df_${tableOrName}_${columnName}`;
  }
}
