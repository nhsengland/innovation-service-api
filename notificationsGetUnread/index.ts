import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import { AppInsights, SQLConnector, Validator } from "../utils/decorators";
import { CustomContext } from "../utils/types";

class NotificationsGetUnread {
  @AppInsights()
  @SQLConnector()
  @Validator(
    validation.ValidateQueryParams,
    "query",
    "Invalid querystring parameters."
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const result = await persistence.getUnreadNotificationsCounts(
      context,
      req.query.innovationId
    );

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound(null);
  }
}

export default NotificationsGetUnread.httpTrigger;
