import { HttpRequest } from "@azure/functions";
import {
  NotifContextType,
  PaginationQueryParamsType,
} from "@domain/enums/notification.enums";
import { AccessorOrganisationRole, UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class NotificationsGetAll {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ACCESSOR, UserType.INNOVATOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const queryParams = (req.query as unknown) as PaginationQueryParamsType<"createdAt"> & {
      contextTypes: NotifContextType;
      unreadOnly: boolean;
    };

    const { skip, take, order, ...filters } = queryParams;

    let result;
    try {
      result = await persistence.getNotificationsByUserId(context, filters, {
        skip,
        take,
        order,
      });
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default NotificationsGetAll.httpTrigger;
