import * as dotenv from "dotenv";

dotenv.config();

export const connection = {
  type: "mssql",
  host: process.env.DB_HOST, //"domain-models.database.windows.net",
  username: process.env.DB_USER, //"test-admin",
  password: process.env.DB_PWD, //"",
  database: process.env.DB_NAME, //"domain-models",
  synchronize: false,
  logging: false,
};
