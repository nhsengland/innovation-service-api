import { HttpRequest } from "@azure/functions";
import {
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, ServiceRole, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AdminsValidateLock {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder(true)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const userId = req.params.userId;
    let result;
    try {
      result = await persistence.lockValidation(context, userId);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AdminsValidateLock.httpTrigger;
