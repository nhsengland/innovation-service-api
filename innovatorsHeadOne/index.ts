import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import { setupSQLConnection } from "../utils/connection";

export default async function innovatorsHeadOne(
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

  const validate = validation.ValidateParams(req.params);
  if (validate.error) {
    context.log.error(validate.error);
    context.res = Responsify.BadRequest({ error: "Invalid query parameters" });
    return;
  }

  const oid = req.params.innovatorId;

  const result = await persistence.findInnovatorById(oid);

  if (result) {
    context.res = Responsify.Ok();
    return;
  }

  context.res = Responsify.NotFound(null);
}
