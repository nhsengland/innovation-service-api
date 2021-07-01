import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole, UserType } from "@services/index";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AccessorsGetAllInnovations {
  @AppInsights()
  @SQLConnector()
  @Validator(
    validation.ValidateQueryParams,
    "query",
    "Invalid querystring parameters."
  )
  @JwtDecoder()
  @OrganisationRoleValidator(
    UserType.ACCESSOR,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    AccessorOrganisationRole.ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest,
    auth: any
  ): Promise<void> {
    const query: any = req.query;
    const supportStatus = query.supportStatus;
    const assignedToMe = query.assignedToMe
      ? query.assignedToMe.toLocaleLowerCase() === "true"
      : false;
    const skip = parseInt(query.skip);
    const take = parseInt(query.take);

    let order;
    if (query.order) {
      order = JSON.parse(query.order);
    }

    let result;
    try {
      result = await persistence.findAllInnovationsByAccessor(
        context,
        supportStatus,
        assignedToMe,
        skip,
        take,
        order
      );
    } catch (error) {
      context.log.error(error);
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetAllInnovations.httpTrigger;
