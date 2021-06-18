import { HttpRequest } from "@azure/functions";
import { InnovatorOrganisationRole } from "@services/index";
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

class InnovatorsSubmitInnovationSections {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @OrganisationRoleValidator(InnovatorOrganisationRole.INNOVATOR_OWNER)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const payload = req.body;
    const innovatorId = req.params.innovatorId;
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    if (innovatorId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.submitInnovationSections(
        context,
        innovationId,
        innovatorId,
        payload.sections
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.NoContent();
  }
}

export default InnovatorsSubmitInnovationSections.httpTrigger;
