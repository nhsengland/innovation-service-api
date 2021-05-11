import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import { AppInsights, SQLConnector, Validator } from "../utils/decorators";
import { CustomContext } from "../utils/types";

class InnovatorsHeadOne {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidateParams, "params", "Invalid Query Parameters")
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const oid = req.params.innovatorId;

    const result = await persistence.findInnovatorById(context, oid);

    if (result) {
      context.res = Responsify.Ok();
      return;
    }
    context.res = Responsify.NotFound(null);
  }
}

export default InnovatorsHeadOne.httpTrigger;
