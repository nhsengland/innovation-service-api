import { HttpRequest } from "@azure/functions";
import { InnovatorOrganisationRole } from "@services/index";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";

class InnovatorsPostInnovationsFiles {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidateHeaders, "headers", "Invalid Headers")
  @JwtDecoder()
  @OrganisationRoleValidator(InnovatorOrganisationRole.INNOVATOR_OWNER)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const payload = req.body;
    const innovationId = req.params.innovationId;

    try {
      const result = await persistence.getUploadUrl(
        context,
        payload.fileName,
        innovationId,
        payload.context
      );

      context.res = Responsify.Created(result);
      context.log.info("Innovation File metadata was created");
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }
  }
}

export default InnovatorsPostInnovationsFiles.httpTrigger;
