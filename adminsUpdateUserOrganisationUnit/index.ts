import { HttpRequest } from "@azure/functions";
import { ServiceRole, UserType } from "@services/index";
import { SLSEventType } from "@services/types";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  SLSValidation,
  SQLConnector,
  Validator,
  CosmosConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AdminsUpdateUserOrganisationUnit {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder(true)
  @CosmosConnector()
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN)
  @SLSValidation(SLSEventType.ADMIN_UPDATE_ORGANISATION_UNIT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const body = req.body;
    const userId = req.params.userId;

    let result;
    try {
      result = await persistence.updateUserOrganisationUnit(
        context,
        userId,
        body.newOrganisationUnitAcronym,
        body.organisationId
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

export default AdminsUpdateUserOrganisationUnit.httpTrigger;
