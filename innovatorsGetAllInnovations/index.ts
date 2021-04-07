import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import { setupSQLConnection } from "../utils/connection";
import { decodeToken } from "../utils/authentication";

export default async function innovatorsGetAllInnovations(
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await setupSQLConnection();
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal({
      error: "Error establishing connection with the datasource.",
    });
    return;
  }
  context.log.info("Database connection established");

  const innovatorId = req.params.innovatorId;
  const token = req.headers.authorization;
  const jwt = decodeToken(token);
  const oid = jwt.oid;

  if (innovatorId !== oid) {
    context.res = Responsify.Forbidden({ error: "Operation denied." });
    return;
  }

  let result;
  try {
    result = await persistence.findAllInnovationsByInnovator(innovatorId);
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal();
    return;
  }

  context.res = Responsify.Ok(result);
}
