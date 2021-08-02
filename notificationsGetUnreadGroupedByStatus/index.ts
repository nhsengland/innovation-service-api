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
import { AccessorOrganisationRole, InnovatorOrganisationRole, UserType } from "@domain/index";
import { ValidateQueryParams } from "./validation";

class NotificationsGetUnreadGroupedByStatus {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @Validator(ValidateQueryParams, 'query', 'scope is required and must be either INNOVATION_STATUS or SUPPORT_STATUS')
  @AllowedUserType(UserType.INNOVATOR, UserType.ACCESSOR, UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const scope = req.query.scope;
    const result = await persistence.getNotificationsGroupedByStatus(
      context,
      scope,
    );

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound(null);
  }
}

export default NotificationsGetUnreadGroupedByStatus.httpTrigger;
