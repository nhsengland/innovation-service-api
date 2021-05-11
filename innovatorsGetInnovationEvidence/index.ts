import { HttpRequest } from "@azure/functions";
import { InnovatorOrganisationRole } from "@domain/index";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsGetInnovationEvidence {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator(InnovatorOrganisationRole.INNOVATOR_OWNER)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovatorId = req.params.innovatorId;
    const oid = context.auth.decodedJwt.oid;

    if (innovatorId !== oid) {
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
        context.log.error("Evidence not found!");
        context.res = Responsify.NotFound();
        return;
      }
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default InnovatorsGetInnovationEvidence.httpTrigger;
