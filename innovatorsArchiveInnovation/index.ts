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

class InnovatorsArchiveInnovation {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;
    const reason = req.body.reason;

    let result;
    try {
      result = await persistence.archiveInnovation(
        context,
        innovationId,
        reason
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

export default InnovatorsArchiveInnovation.httpTrigger;
