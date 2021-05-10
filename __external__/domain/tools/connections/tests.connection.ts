import { ConnectionOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as helpers from "../helpers";
import * as C from "../constants";

if (process.env.NODE_ENV !== "production") dotenv.config();

export const getTestsConnection = (): ConnectionOptions => ({
  host: process.env.DB_TESTS_HOST,
  username: process.env.DB_TESTS_USER,
  password: process.env.DB_TESTS_PWD,
  database: process.env.DB_TESTS_NAME,
  name: "tests",
  type: "mssql",
  synchronize: false,
  extra: {
    options: {
      enableArithAbort: true,
    },
  },
  entities: [helpers.rootDir("src/entity/*/**.entity.ts")],
  migrations: [helpers.rootDir(`${C.TYPEORM_MIGRATIONS_DIR}/*.ts`)],
  migrationsTableName: C.TYPEORM_MIGRATIONS_TABLE_NAME,
  cli: {
    migrationsDir: C.TYPEORM_MIGRATIONS_DIR,
  },
});
