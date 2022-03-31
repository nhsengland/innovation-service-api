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

class AdminsHeadOrganisationAcronym {
  @AppInsights()
  @SQLConnector()
  @Validator(
    validation.ValidateQuerySchema,
    "query",
    "Invalid querystring params"
  )
  @JwtDecoder(true)
  @AllowedUserType(UserType.ADMIN)
  @ServiceRoleValidator(ServiceRole.ADMIN)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const acronym: string = req.query.acronym;
    const organisationId: string = req.query.organisationId;

    let result;

    if (!acronym) {
      context.res = Responsify.BadRequest("acronym is missing");
      return;
    }

    try {
      result = await persistence.searchOrganisationByAcronym(
        context,
        acronym,
        organisationId
      );

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

export default AdminsHeadOrganisationAcronym.httpTrigger;
