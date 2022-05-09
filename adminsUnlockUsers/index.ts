import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
import { SLSEventType } from "@services/types";
import {
  AllowedUserType,
  AppInsights,
  CosmosConnector,
  JwtDecoder,
  ServiceRoleValidator,
  SLSValidation,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, ServiceRole, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AdminsLockUsers {
  @AppInsights()
  @SQLConnector()
  @CosmosConnector()
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  @SLSValidation(SLSEventType.ADMIN_LOCK_USER)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const user = req.params.userId;
    const externalId = context.auth.requestUser.externalId;
    const id = context.auth.requestUser.id;

    let result;
    try {
      context.auth.requestUser = {
        id,
        externalId,
        type: UserType.ADMIN,
      };

      result = await persistence.unlockUser(context, user);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AdminsLockUsers.httpTrigger;
