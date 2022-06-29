import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
import { NotificationDismissResult } from "@services/services/Notification.service";
import { JoiHelper } from "../utils/joi.helper";
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
import { BodySchema, BodyParamsType } from "./validation";

class notificationsPatchDismiss {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR, UserType.ACCESSOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    let result: NotificationDismissResult;

    JoiHelper.Validate<BodyParamsType>(BodySchema, req.body);

    try {
      result = await persistence.patchDismissNotification(
        context,
        !!req.body.dismissAll,
        req.body.notificationIds,
        req.body.context
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

export default notificationsPatchDismiss.httpTrigger;
