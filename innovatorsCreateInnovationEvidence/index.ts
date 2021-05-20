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
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class InnovatorsCreateInnovationEvidence {
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
    const oid = context.auth.decodedJwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    evidence.innovation = innovationId;

    let result;
    try {
      result = await persistence.createInnovationEvidence(
        context,
        oid,
        evidence,
        InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
      );
    } catch (error) {
      context.logger(
        `[${req.method}] ${req.url}`,
        Severity.Error,
        { error },
        error
      );
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Created({ id: result.id });
  }
}

export default InnovatorsCreateInnovationEvidence.httpTrigger;
