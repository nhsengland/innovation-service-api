import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import { decodeToken } from "../utils/authentication";
import { SQLConnector } from "../utils/decorators";

class InnovatorsGetInnovation {
  @SQLConnector()
  static async httpTrigger(context: Context, req: HttpRequest): Promise<void> {
    const innovatorId = req.params.innovatorId;
    const innovationId = req.params.innovationId;
    const token = req.headers.authorization;
    const jwt = decodeToken(token);
    const oid = jwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.findInnovationsByInnovator(
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

export default InnovatorsGetInnovation.httpTrigger;
