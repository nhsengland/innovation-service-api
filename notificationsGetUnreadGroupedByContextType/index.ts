import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as validation from "./validation";
import * as Responsify from "../utils/responsify";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext } from "../utils/types";
import { UserType } from "@domain/index";

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
    const result = await persistence.getAllUnreadNotificationsCounts(
      context,
      innovationId
    );

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound(null);
  }
}

export default NotificationsGetUnreadGroupedByContext.httpTrigger;
