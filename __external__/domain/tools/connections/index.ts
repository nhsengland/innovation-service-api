import { ConnectionOptions } from "typeorm";
import { getDefaultConnection } from "./default.connection";
import { getMigrationConnection } from "./migration.connection";
import { getSeedConnection } from "./seed.connection";
import { getTestsConnection } from "./tests.connection";

export const defaultConnection = getDefaultConnection;
export const migrationConnection = getMigrationConnection;
export const seedConnection = getSeedConnection;
export const testConnection = getTestsConnection;

export const getTypeOrmConfig = (): ConnectionOptions[] => {
  return [
    { ...getDefaultConnection() },
    { ...getMigrationConnection() },
    { ...getSeedConnection() },
    { ...getTestsConnection() },
  ];
};
