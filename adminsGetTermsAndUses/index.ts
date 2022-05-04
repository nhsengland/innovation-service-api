import { HttpRequest } from "@azure/functions";
import { ServiceRole, UserType } from "@services/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  // SLSValidation,
  SQLConnector,
  // CosmosConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AdminsGetTermsAndUses {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const query: any = req.query;
    const skip = parseInt(query.skip);
    const take = parseInt(query.take);

    let order;
    if (query.order) {
      order = JSON.parse(query.order);
    }

    let result;
    try {
      result = await persistence.createTermsAndUses(context, skip, take, order);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AdminsGetTermsAndUses.httpTrigger;
