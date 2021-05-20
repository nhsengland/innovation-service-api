import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import { decodeToken } from "../utils/authentication";
import { AppInsights, JwtDecoder, SQLConnector } from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";

class InnovatorsGetAllInnovations {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovatorId = req.params.innovatorId;
    const oid = context.auth.decodedJwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.findAllInnovationsByInnovator(
        context,
        innovatorId
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default InnovatorsGetAllInnovations.httpTrigger;
