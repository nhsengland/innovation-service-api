import { HttpRequest } from "@azure/functions";
import { AccessorOrganisationRole, UserType } from "@domain/index";
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
import { ValidateQueryParams } from "./validation";

class AccessorsGetAllActionsAdvance {
  @AppInsights()
  @Validator(ValidateQueryParams, "query", "Missing query fields")
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator(
    UserType.ACCESSOR,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    AccessorOrganisationRole.ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const query: any = req.query;
    const innovationStatus =
      query.innovationStatus?.split(",").filter((o) => o !== "") || [];
    const innovationSection =
      query.innovationSection?.split(",").filter((l) => l !== "") || [];
    const name =
      query.name && query.name !== "" && query.name.length > 0
        ? query.name
        : undefined;
    const skip = parseInt(query.skip);
    const take = parseInt(query.take);
    let order;
    if (query.order) {
      order = JSON.parse(query.order);
    }
    let result;
    try {
      result = await persistence.findAllByAccessorAdvanced(
        context,
        innovationStatus,
        innovationSection,
        name,
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

export default AccessorsGetAllActionsAdvance.httpTrigger;
