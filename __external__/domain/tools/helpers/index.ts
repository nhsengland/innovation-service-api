import { getConnection } from "typeorm";

import * as path from "path";

export const rootDir = path.join.bind(
  path,
  path.resolve(path.join(__dirname, "..", ".."))
);

export const templateDir = path.join.bind(
  path,
  path.resolve(path.join(__dirname, "..", "..", "tools", "templates"))
);

export const configDir = path.join.bind(path, __dirname);
export const parseEnvBoolean = (v: any): boolean => v === "true" || !!+v;

export const getEntityColumnList = async (entity: any) => {
  const connection = await getConnection(process.env.DB_TESTS_NAME);
  const columns = connection
    .getMetadata(entity)
    .ownColumns.map((c) => c.propertyName);

  return columns;
};
