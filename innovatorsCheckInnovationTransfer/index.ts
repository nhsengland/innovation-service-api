import { HttpRequest } from "@azure/functions";
import { AppInsights, SQLConnector } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsCheckInnovationTransfer {
  @AppInsights()
  @SQLConnector()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const transferId = req.params.transferId;

    let result;
    try {
      result = await persistence.checkInnovationTransferById(
        context,
        transferId
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default InnovatorsCheckInnovationTransfer.httpTrigger;
