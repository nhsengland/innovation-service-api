import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import { setupSQLConnection } from "../utils/connection";

export default async function innovatorsHeadOne(
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await setupSQLConnection();
  } catch (error) {
    context.log(error);
    context.res = Responsify.Internal({
      error: "Error establishing connection with the datasource.",
    });
    return;
  }
  context.log("Database connection established");

  const oid = req.params.innovatorId;

  const result = await persistence.findInnovatorByOid(oid);

  if (result && result.length > 0) {
    context.res = Responsify.Ok();
    return;
  }

  context.res = Responsify.NotFound(null);
}
