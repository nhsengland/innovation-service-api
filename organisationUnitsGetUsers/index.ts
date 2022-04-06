import { HttpRequest } from "@azure/functions";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { UserType, ServiceRole } from "@domain/index";
import {
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
  AllowedUserType,
  ServiceRoleValidator,
} from "../utils/decorators";

class OrganisationUnitGetUsers {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder(true)
  @Validator(validation.ValidateParams, "params", "Invalid Query Parameters")
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const organisationUnitId = req.params.organisationUnitId;

    let result;
    try {
      result = await persistence.findOrganisationUnitUsers(
        context,
        organisationUnitId
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default OrganisationUnitGetUsers.httpTrigger;
