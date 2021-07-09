import { ConnectionOptions } from "typeorm";
import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") dotenv.config();
export const getDefaultConnection = (): ConnectionOptions => ({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  name: "default",
  type: "mssql",
  synchronize: false,
  extra: {
    options: {
      enableArithAbort: true,
    },
  },
});
