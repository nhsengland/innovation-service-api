import { HttpRequest } from "@azure/functions";
import { InnovationSectionCatalogue, UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class InnovatorsUpdateInnovationEvidence {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const evidence = req.body;
    const innovatorId = req.params.innovatorId;
    const innovationId = req.params.innovationId;
    const evidenceId = req.params.evidenceId;
    const oid = context.auth.decodedJwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    const evidenceResult = await persistence.getEvidenceWithOwner(
      context,
      evidenceId
    );
    if (evidenceResult.innovation.owner.id !== innovatorId) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    evidence.innovation = innovationId;

    let result;
    try {
      result = await persistence.updateInnovationEvidence(
        context,
        evidenceId,
        oid,
        evidence,
        InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
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

export default InnovatorsUpdateInnovationEvidence.httpTrigger;
