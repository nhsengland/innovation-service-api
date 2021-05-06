import * as dotenv from "dotenv";
import { ConnectionOptions } from "typeorm";
import { entities } from "@services/entities/index";

dotenv.config();

export const connection: ConnectionOptions = {
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities,
};
