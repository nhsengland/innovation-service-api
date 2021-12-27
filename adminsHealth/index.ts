import { HttpRequest } from "@azure/functions";
import {
  AppInsights,
  CosmosConnector,
  JwtDecoder,
  SLSValidation,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";
import { ValidatePayload } from "./validation";

class adminHealth {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @CosmosConnector()
  @SLSValidation("LOGIN")
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    try {
      const result = "ADMIN HEALTH CHECK";

      context.res = Responsify.Ok(result);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal({
        error: "Error occured while calling ADMIN HEALTH CHECK endpoint.",
      });
      return;
    }
  }
}

export default adminHealth.httpTrigger;
