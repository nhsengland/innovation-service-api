import { HttpRequest } from "@azure/functions";
import { AppInsights, SQLConnector, Validator } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class InnovatorsHeadOne {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidateParams, "params", "Invalid Query Parameters")
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const userId = req.params.userId;

    const result = await persistence.findInnovatorById(context, userId);

    if (result) {
      context.res = Responsify.Ok();
      return;
    }
    context.res = Responsify.NotFound(null);
  }
}

export default InnovatorsHeadOne.httpTrigger;
