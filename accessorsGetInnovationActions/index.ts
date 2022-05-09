import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole, UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AccessorsGetInnovationActions {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ACCESSOR)
  @OrganisationRoleValidator(
    UserType.ACCESSOR,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    AccessorOrganisationRole.ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;

    let result;
    try {
      result = await persistence.findInnovationActions(context, innovationId);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetInnovationActions.httpTrigger;
