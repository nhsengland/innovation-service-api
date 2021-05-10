import { getConnection } from "typeorm";
import { setupConnection } from "./connection-helper";

beforeAll(async () => {
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
});

afterAll(async () => {
  getConnection(process.env.DB_TESTS_NAME).close();
});
