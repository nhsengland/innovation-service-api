import { createConnection } from "typeorm";
import { getTestsConnection } from "../__external__/domain/tools/connections/tests.connection";
import { entities } from "@entities/index";

export const setupConnection = async () => {
  return await createConnection({
    ...getTestsConnection(),
    entities,
  });
};
