import { HttpRequest } from "@azure/functions";
import { logger } from "@azure/storage-blob";
import { UserType } from "@services/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, ServiceRole, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AdminsUserDetails {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const model: "MINIMAL" | "FULL" =
      (req.query.model as "MINIMAL" | "FULL") || "MINIMAL";
    const user: string = req.params.userId;
    let result;
    try {
      try {
        result = await persistence.getUser(context, user, model);
        context.res = Responsify.Ok(result);
      } catch (error) {
        context.logger(`[${req.method}] ${req.url}`, Severity.Error, {
          error,
        });
        context.log.error(error);
        context.res = Responsify.ErroHandling(error);
        return;
      }
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }
  }
}

export default AdminsUserDetails.httpTrigger;
