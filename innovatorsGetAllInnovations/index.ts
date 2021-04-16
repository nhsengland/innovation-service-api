import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import { decodeToken } from "../utils/authentication";
import { SQLConnector } from "../utils/decorators";

class InnovatorsGetAllInnovations {
  @SQLConnector()
  static async httpTrigger(context: Context, req: HttpRequest): Promise<void> {
    const innovatorId = req.params.innovatorId;
    const token = req.headers.authorization;
    const jwt = decodeToken(token);
    const oid = jwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.findAllInnovationsByInnovator(innovatorId);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default InnovatorsGetAllInnovations.httpTrigger;
