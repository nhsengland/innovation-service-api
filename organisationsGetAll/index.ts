import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import { SQLConnector, Validator } from "../utils/decorators";

class OrganisationsGetAll {
  @SQLConnector()
  @Validator(
    validation.ValidateQueryParams,
    "query",
    "Invalid querystring parameters."
  )
  static async httpTrigger(context: Context, req: HttpRequest): Promise<void> {
    const result = await persistence.findAll(req.query);

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound(null);
  }
}

export default OrganisationsGetAll.httpTrigger;
