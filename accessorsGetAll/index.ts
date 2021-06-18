import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole } from "@services/index";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AccessorsGetAll {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator(AccessorOrganisationRole.QUALIFYING_ACCESSOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const oid = context.auth.decodedJwt.oid;

    let result;
    try {
      result = await persistence.findUserOrganisationUnitUsers(context, oid);
    } catch (error) {
      context.log.error(error);
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetAll.httpTrigger;
