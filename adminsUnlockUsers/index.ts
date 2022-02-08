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
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, ServiceRole, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AdminsLockUsers {
  @AppInsights()
  @SQLConnector()
  @CosmosConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  @SLSValidation(SLSEventType.ADMIN_LOCK_USER)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const user = req.params.userId;
    const oid = context.auth.decodedJwt.oid;

    let result;
    try {
      context.auth.requestUser = {
        id: oid,
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
