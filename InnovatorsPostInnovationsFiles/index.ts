import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
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

class InnovatorsPostInnovationsFiles {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidateHeaders, "headers", "Invalid Headers")
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR)
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
      context.res = Responsify.ErroHandling(error);
      return;
    }
  }
}

export default InnovatorsPostInnovationsFiles.httpTrigger;
