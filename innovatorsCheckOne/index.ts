import { HttpRequest } from "@azure/functions";
import { AppInsights, SQLConnector } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsHeadOne {
  @AppInsights()
  @SQLConnector()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const userId = req.params.userId;

    const result = await persistence.checkUserPendingTransfers(context, userId);

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }
    context.res = Responsify.NotFound(null);
  }
}

export default InnovatorsHeadOne.httpTrigger;
