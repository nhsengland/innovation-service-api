import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole, UserType } from "@domain/index";
import {
  AppInsights,
  JwtDecoder,
  // OrganisationRoleValidator,
  AllowedUserType,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AssessmentsGetInnovationSupport {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ASSESSMENT)
  // @OrganisationRoleValidator(
  //   UserType.ASSESSMENT,
  //   // AccessorOrganisationRole.ACCESSOR,
  //   // AccessorOrganisationRole.QUALIFYING_ACCESSOR
  // )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;
    const supportId = req.params.supportId;

    let result;
    try {
      result = await persistence.findInnovationSupport(
        context,
        supportId,
        innovationId
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AssessmentsGetInnovationSupport.httpTrigger;
