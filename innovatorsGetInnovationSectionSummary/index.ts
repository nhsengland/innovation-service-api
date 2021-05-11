import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import { AppInsights, JwtDecoder, SQLConnector } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";

class InnovatorsGetInnovationSectionSummary {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovatorId = req.params.innovatorId;
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.findAllInnovationSectionsByInnovator(
        context,
        innovatorId,
        innovationId
      );
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default InnovatorsGetInnovationSectionSummary.httpTrigger;
