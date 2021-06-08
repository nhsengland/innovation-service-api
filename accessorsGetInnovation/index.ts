import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";
import { AccessorOrganisationRole } from "@domain/index";

class AccessorsGetInnovation {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator(
    AccessorOrganisationRole.ACCESSOR,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const accessorId = req.params.accessorId;
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    if (accessorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.findInnovationOverview(
        context,
        accessorId,
        innovationId
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

export default AccessorsGetInnovation.httpTrigger;
