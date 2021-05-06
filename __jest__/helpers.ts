import { getConnection } from "typeorm";

export const getEntityColumnList = async (entity: any) => {
  const connection = await getConnection(process.env.DB_TESTS_NAME);
  const columns = connection
    .getMetadata(entity)
    .ownColumns.map((c) => c.propertyName);

  return columns;
};
