import { ConnectionOptions } from "typeorm";
import { getDefaultConnection } from "./default.connection";
import * as C from "../constants";
import * as helpers from "../helpers";
import { CustomNamingStrategy } from "../strategies/CustomNamingStrategy";

export const getMigrationConnection = (): ConnectionOptions => {
  const defaultConnection = getDefaultConnection();
  return {
    ...defaultConnection,
    name: C.TYPEORM_MIGRATION_CONNECTION_NAME,
    entities: [helpers.rootDir("src/entity/*/**.entity.ts")],
    migrations: [helpers.rootDir(`${C.TYPEORM_MIGRATIONS_DIR}/*.ts`)],
    migrationsTableName: C.TYPEORM_MIGRATIONS_TABLE_NAME,
    cli: {
      migrationsDir: `${C.TYPEORM_CLI_ROOT_PATH}${C.TYPEORM_MIGRATIONS_DIR}`,
    },
    namingStrategy: new CustomNamingStrategy(),
  };
};
