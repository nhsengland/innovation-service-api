import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import { AccessorOrganisationRole } from "@services/index";

class AccessorsGetInnovationSectionSummary {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator(
    AccessorOrganisationRole.ACCESSOR,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const accessorId = req.params.userId;
    const innovationId = req.params.innovationId;

    let result;
    try {
      result = await persistence.findAllInnovationSections(
        context,
        innovationId,
        accessorId
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

export default AccessorsGetInnovationSectionSummary.httpTrigger;
