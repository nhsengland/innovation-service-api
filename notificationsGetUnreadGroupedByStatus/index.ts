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
import { ValidateQueryParams } from "./validation";

class NotificationsGetUnreadGroupedByStatus {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @Validator(
    ValidateQueryParams,
    "query",
    "scope is required and must be either INNOVATION_STATUS or SUPPORT_STATUS"
  )
  @AllowedUserType(UserType.INNOVATOR, UserType.ACCESSOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const scope = req.query.scope;

    let result: any;
    try {
      result = await persistence.getNotificationsGroupedByStatus(
        context,
        scope
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

export default NotificationsGetUnreadGroupedByStatus.httpTrigger;
