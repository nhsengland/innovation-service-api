import { getConnection } from "typeorm";
import { setupConnection } from "./connection-helper";

// tslint:disable-next-line: no-var-requires
require("ts-node/register");
// tslint:disable-next-line: no-var-requires
require("tsconfig-paths/register");

export default async () => {
  const t0 = Date.now();
  const connection = await setupConnection();
  const connectTime = Date.now();
  await connection.runMigrations();
  const migrationTime = Date.now();
  console.log(
    ` Connected in ${connectTime - t0}ms - Executed migrations in ${
      migrationTime - connectTime
    }ms.`
  );

  await getConnection(process.env.DB_TESTS_NAME).close();
};
