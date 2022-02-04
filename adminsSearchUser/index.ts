import { HttpRequest } from "@azure/functions";
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
import * as validation from "./validation";

class AdminsSearchUser {
  @AppInsights()
  @SQLConnector()
  @Validator(
    validation.ValidateQuerySchema,
    "query",
    "Invalid querystring params"
  )
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const email: string = req.query.email;

    let result;
    try {
      result = await persistence.searchUserByEmail(context, email);

      if (result) {
        context.res = Responsify.Ok();
      } else {
        context.res = Responsify.NotFound();
      }
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }
  }
}

export default AdminsSearchUser.httpTrigger;
