import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
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
    const oid = context.auth.decodedJwt.oid;

    if (accessorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    const query: any = req.query;

    const filter = {
      ...query,
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
