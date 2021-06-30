import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole } from "@domain/index";
import { ValidateQueryParams } from "./validation";
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

class AccessorsGetAllActions {
  @AppInsights()
  @Validator(ValidateQueryParams, "query", "Missing query fields")
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator(
    AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    AccessorOrganisationRole.ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const accessorId = req.params.userId;

    const query: any = req.query;
    const openActions = query.openActions.toLocaleLowerCase() === "true";
    const skip = parseInt(query.skip);
    const take = parseInt(query.take);

    let order;
    if (query.order) {
      order = JSON.parse(query.order);
    }

    let result;
    try {
      result = await persistence.findAllActions(
        context,
        accessorId,
        openActions,
        skip,
        take,
        order
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

export default AccessorsGetAllActions.httpTrigger;
