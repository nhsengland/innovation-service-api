import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AssessmentsGetInnovationEvidence {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const userId = req.params.userId;
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    if (userId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    const evidenceId = req.params.evidenceId;
    let result;
    try {
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

export default AssessmentsGetInnovationEvidence.httpTrigger;
