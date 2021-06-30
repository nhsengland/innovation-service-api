import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole } from "@domain/index";
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

class AccessorsCreateInnovationComment {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @OrganisationRoleValidator(AccessorOrganisationRole.QUALIFYING_ACCESSOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const body = req.body;
    const accessorId = req.params.userId;
    const innovationId = req.params.innovationId;

    let result;
    try {
      result = await persistence.createInnovationComment(
        context,
        accessorId,
        innovationId,
        body.comment,
        body.replyTo
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Created({ id: result.id });
  }
}

export default AccessorsCreateInnovationComment.httpTrigger;
