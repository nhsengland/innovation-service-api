import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import { setupSQLConnection } from "../utils/connection";

const httpTrigger: AzureFunction = async function (
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

  const validate = validation.ValidateQueryParams(req.query);
  if (validate.error) {
    context.log.error(validate.error);
    context.res = Responsify.BadRequest({ error: "Invalid query parameters" });
    return;
  }

  const result = await persistence.findAll(req.query);

  if (result) {
    context.res = Responsify.Ok(result);
    return;
  }

  context.res = Responsify.NotFound(null);
};

export default httpTrigger;
