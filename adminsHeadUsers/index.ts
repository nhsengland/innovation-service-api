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
import * as validation from "./validation";

class AdminsHeadUsers {
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

    if (!email) {
      context.res = Responsify.BadRequest("email or type are missing");
      return;
    }

    if (email) {
      try {
        result = await persistence.searchUserByEmail(context, email);
        console.log(result);
        if (result) {
          context.res = Responsify.Ok();
        } else {
          context.res = Responsify.NotFound("User not found");
        }
      } catch (error) {
        context.logger(`[${req.method}] ${req.url}`, Severity.Error, {
          error,
        });
        context.log.error(error);
        context.res = Responsify.ErroHandling(error);
        return;
      }
    }
  }
}

export default AdminsHeadUsers.httpTrigger;
