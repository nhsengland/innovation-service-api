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

class AccessorsGetInnovationEvidence {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ACCESSOR)
  @OrganisationRoleValidator(
    UserType.ACCESSOR,
    AccessorOrganisationRole.ACCESSOR,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;
    const evidenceId = req.params.evidenceId;

    let result;
    try {
      const innovation = await persistence.findInnovationByAccessorId(
        context,
        innovationId
      );

      if (!innovation) {
        context.res = Responsify.Forbidden({ error: "Operation denied." });
        return;
      }

      result = await persistence.findInnovationEvidenceById(
        context,
        evidenceId
      );

      result.innovation = innovationId;
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetInnovationEvidence.httpTrigger;
