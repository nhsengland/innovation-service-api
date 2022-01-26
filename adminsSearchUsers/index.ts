import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
import {
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, ServiceRole, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AdminsSearchUsers {
  @AppInsights()
  @SQLConnector()
  @Validator(
    validation.ValidateQuerySchema,
    "query",
    "Invalid querystring params"
  )
  @JwtDecoder(true)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const type: UserType = UserType[req.query.type];
    const email: string = req.query.email;

    let result;
    try {
      if (email && type) {
        context.res = Responsify.BadRequest(
          "email and type are mutually exclusive"
        );
        return;
      }

      if (!email && !type) {
        context.res = Responsify.BadRequest("email or type are missing");
        return;
      }

      if (email) {
        result = await persistence.searchUserByEmail(context, email);
        context.res = Responsify.Ok(result);
      }

      if (type) {
        result = await persistence.searchUsersByType(context, type);
        context.res = Responsify.Ok(result);
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

export default AdminsSearchUsers.httpTrigger;
