import { HttpRequest } from "@azure/functions";
import { AppInsights, JwtDecoder, SQLConnector } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsGetInnovationTransfers {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const assignedToMe = req.query.assignedToMe
      ? req.query.assignedToMe.toLocaleLowerCase() === "true"
      : false;

    let result;
    try {
      result = await persistence.findInnovationTransfers(context, assignedToMe);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default InnovatorsGetInnovationTransfers.httpTrigger;
