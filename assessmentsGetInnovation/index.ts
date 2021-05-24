import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import { AppInsights, JwtDecoder, SQLConnector } from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";

class AssessmentsGetInnovation {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    let result;
    try {
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AssessmentsGetInnovation.httpTrigger;
