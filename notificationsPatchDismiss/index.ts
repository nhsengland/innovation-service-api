import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
import { NotificationDismissResult } from "@services/services/Notification.service";
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

class NotificationsDismiss {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @Validator(validation.ValidatePayload, "body", "Invalid payload.")
  @AllowedUserType(UserType.INNOVATOR, UserType.ACCESSOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    let result: NotificationDismissResult;
    try {
      result = await persistence.patchDismissNotification(
        context,
        req.body.contextId,
        req.body.contextType
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound(null);
  }
}

export default NotificationsDismiss.httpTrigger;
