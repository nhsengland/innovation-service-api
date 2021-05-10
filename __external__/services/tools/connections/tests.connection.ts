import { ConnectionOptions } from "typeorm";
import { entities } from "@services/entities/index";

export const getTestsConnection = (): ConnectionOptions => ({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  name: "tests",
  type: "mssql",
  synchronize: false,
  extra: {
    options: {
      enableArithAbort: true,
    },
  },
});
