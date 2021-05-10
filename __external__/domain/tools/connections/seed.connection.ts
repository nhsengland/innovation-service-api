import { ConnectionOptions } from "typeorm";
import { getDefaultConnection } from "./default.connection";
import * as C from "../constants";
import * as helpers from "../helpers";

export const getSeedConnection = (): ConnectionOptions => {
  const defaultConnection = getDefaultConnection();
  return {
    ...defaultConnection,
    name: C.TYPEORM_SEEDING_CONNECTION_NAME,
    entities: ["../../src/entity/**/*.ts"],
    migrations: [helpers.rootDir(`${C.TYPEORM_SEEDING_DIR}/*.ts`)],
    migrationsTableName: C.TYPEORM_SEEDS_TABLE_NAME,
    cli: {
      migrationsDir: C.TYPEORM_SEEDING_DIR,
    },
  };
};
