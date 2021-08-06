import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class NotificationsGetUnreadGroupedByContext {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR, UserType.ACCESSOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.query.innovationId;

    let result: any;
    try {
      result = await persistence.getAllUnreadNotificationsCounts(
        context,
        innovationId
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

export default NotificationsGetUnreadGroupedByContext.httpTrigger;
