import { HttpRequest } from "@azure/functions";
import { AppInsights, CosmosConnector, JwtDecoder } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";

class AuthSendCode {
  @AppInsights()
  @CosmosConnector()
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    try {
      const result = await persistence.getCode(context);

      context.res = Responsify.Ok(result);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal({
        error: "Error occured while generating a TOTP Code",
      });
      return;
    }
  }
}

export default AuthSendCode.httpTrigger;
