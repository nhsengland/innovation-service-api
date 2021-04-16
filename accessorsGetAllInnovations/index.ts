import { Context, HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { decodeToken } from "../utils/authentication";
import { JwtDecoder, SQLConnector, Validator } from "../utils/decorators";
import { CustomContext } from "../utils/types";

class AccessorsGetAllInnovations {
  @SQLConnector()
  @Validator(
    validation.ValidateQueryParams,
    "query",
    "Invalid querystring parameters."
  )
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest,
    auth: any
  ): Promise<void> {
    const accessorId = req.params.accessorId;
    const token = req.headers.authorization;
    const jwt = decodeToken(token);
    const oid = context.auth.decodedJwt.oid;

    if (accessorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    const query: any = req.query;
    const page = query.limit;
    const rows = query.offset;

    const filter = {
      ...query,
      take: rows,
      skip: (page - 1) * rows,
    };

    let result;
    try {
      result = await persistence.findAllInnovationsByAccessor(
        context,
        accessorId,
        filter
      );
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetAllInnovations.httpTrigger;
