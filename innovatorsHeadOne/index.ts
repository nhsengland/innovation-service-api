import { HttpRequest } from "@azure/functions";
import { User, UserType } from "@domain/index";
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

    const result: User = await persistence.findInnovatorById(context, userId);

    if (
      result &&
      (result.type !== UserType.INNOVATOR || result.firstTimeSignInAt)
    ) {
      context.res = Responsify.Ok();
      return;
    }
    context.res = Responsify.NotFound(null);
  }
}

export default InnovatorsHeadOne.httpTrigger;
