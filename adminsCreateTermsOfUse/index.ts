import { HttpRequest } from "@azure/functions";
import { ServiceRole, UserType } from "@services/index";
import { SLSEventType } from "@services/types";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  // SLSValidation,
  SQLConnector,
  Validator,
  // CosmosConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AdminsCreateTermsOfUse {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN, ServiceRole.SERVICE_TEAM)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const tou = req.body;
    let result;
    try {
      result = await persistence.createTermsOfUse(context, tou);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AdminsCreateTermsOfUse.httpTrigger;
