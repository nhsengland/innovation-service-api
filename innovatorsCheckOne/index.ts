import { HttpRequest } from "@azure/functions";
import { AppInsights, JwtDecoder, SQLConnector } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsCheckOne {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const result = await persistence.checkUserPendingTransfers(
      context,
      context.auth.decodedJwt.oid
    );

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }
    context.res = Responsify.NotFound(null);
  }
}

export default InnovatorsCheckOne.httpTrigger;
