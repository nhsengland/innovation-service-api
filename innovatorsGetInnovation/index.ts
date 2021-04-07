import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import jwt_decode from "jwt-decode";
import * as Responsify from "../utils/responsify";
import { setupSQLConnection } from "../utils/connection";

export default async function innovatorsGetInnovation(
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
  const innovationId = req.params.innovationId;
  const token = req.headers.authorization;
  const jwt = jwt_decode(token) as any;
  const oid = jwt.oid;

  if (innovatorId !== oid) {
    context.res = Responsify.Forbidden({ error: "Operation denied." });
    return;
  }

  let result;
  try {
    result = await persistence.findAllInnovationsByInnovator(
      innovatorId,
      innovationId
    );
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal();
    return;
  }

  context.res = Responsify.Ok(result);
}
