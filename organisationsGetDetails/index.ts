import { HttpRequest } from "@azure/functions";
import { CustomContext, Severity } from "utils/types";
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

class OrganisationsGetDetails {
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
    const organisationId = req.params.organisationId;

    let result;
    try {
      result = await persistence.findOrganisation(context, organisationId);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default OrganisationsGetDetails.httpTrigger;
