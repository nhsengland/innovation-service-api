import { HttpRequest } from "@azure/functions";
import {
  InnovationSectionCatalogue,
  InnovatorOrganisationRole,
} from "@domain/index";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class InnovatorsUpdateInnovationEvidence {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @OrganisationRoleValidator(InnovatorOrganisationRole.INNOVATOR_OWNER)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const evidence = req.body;
    const innovatorId = req.params.innovatorId;
    const innovationId = req.params.innovationId;
    const evidenceId = req.params.evidenceId;
    const oid = context.auth.decodedJwt.oid;

    if (
      innovatorId !== oid ||
      evidence.id !== evidenceId ||
      evidence.innovation !== innovationId
    ) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

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
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(1);
  }
}

export default InnovatorsUpdateInnovationEvidence.httpTrigger;
