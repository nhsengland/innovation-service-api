import { HttpRequest } from "@azure/functions";
import { ServiceRole, UserType } from "@services/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  ServiceRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AdminsUpdateOrganisationNameAcronym {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const body = req.body;
    const organisationId = req.params.organisationId;

    let result;
    try {
      result = await persistence.updateOrganisationNameAcronym(
        context,
        organisationId,
        body.name,
        body.acronym
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

export default AdminsUpdateOrganisationNameAcronym.httpTrigger;
