import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole } from "@domain/index";
import {
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

    const evidenceId = req.params.evidenceId;
    let result;
    try {
      const innovation = await persistence.findInnovationByAccessorId(
        context,
        innovationId,
        accessorId
      );

      if (!innovation) {
        context.res = Responsify.Forbidden({ error: "Operation denied." });
        return;
      }

      result = await persistence.findInnovationEvidenceById(
        context,
        evidenceId
      );

      if (!result) {
        context.logger(`[${req.method}] ${req.url}`, Severity.Error, {
          error: "Evidence was not found",
        });
        context.log.error("Evidence not found!");
        context.res = Responsify.NotFound();
        return;
      }

      result.innovation = innovationId;
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetInnovationEvidence.httpTrigger;
