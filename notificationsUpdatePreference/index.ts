import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
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

class NotificationsUpdatePreferences {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @AllowedUserType(UserType.ACCESSOR, UserType.INNOVATOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const id = req.body.notificationType;
    const isSubscribed = req.body.isSubscribed;

    let result;
    try {
      result = await persistence.updateNotificationPreference(
        context,
        id,
        isSubscribed
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok({ id: result.id });
  }
}

export default NotificationsUpdatePreferences.httpTrigger;
