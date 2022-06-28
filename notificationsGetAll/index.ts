import { HttpRequest } from "@azure/functions";
import { NotifContextType } from "@domain/enums/notification.enums";
import { AccessorOrganisationRole, UserType } from "@domain/index";
import {
  JoiHelper,
  PaginationQueryParamsType,
} from "__external__/domain/tools/helpers/joi.helper";
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
import { QueryParamsSchema, QueryParamsType } from "./validation";

class NotificationsGetAll {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ACCESSOR, UserType.INNOVATOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const queryParams = JoiHelper.Validate<QueryParamsType>(
      QueryParamsSchema,
      req.query
    );

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
