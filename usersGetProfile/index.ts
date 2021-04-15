import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { decodeToken } from "../utils/authentication";
import * as persistence from "./persistence";
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

  const validate = validation.ValidateHeaders(req.headers);
  if (validate.error) {
    context.log.error(validate.error);
    context.res = Responsify.BadRequest({ error: "Invalid query parameters" });
    return;
  }
  const token = req.headers.authorization;
  const jwt = decodeToken(token);
  const id = jwt.oid;

  let result;
  try {
    result = await persistence.getProfile(id);
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal();
    return;
  }

  if (result) {
    context.res = Responsify.Ok(result);
    return;
  }

  context.res = Responsify.NotFound(null);
};

export default httpTrigger;
