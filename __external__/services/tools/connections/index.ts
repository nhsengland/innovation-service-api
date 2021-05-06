import { ConnectionOptions } from "typeorm";
import { getDefaultConnection } from "./default.connection";

import { getTestsConnection } from "./tests.connection";

export const defaultConnection = getDefaultConnection;
export const testConnection = getTestsConnection;

export const getTypeOrmConfig = (): ConnectionOptions[] => {
  return [{ ...getDefaultConnection() }, { ...getTestsConnection() }];
};
