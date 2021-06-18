import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import {
  AppInsights,
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";
import {
  AccessorOrganisationRole,
  Innovation,
  InnovationSupportStatus,
} from "@services/index";

class AccessorsGetAllInnovations {
  @AppInsights()
  @SQLConnector()
  @Validator(
    validation.ValidateQueryParams,
    "query",
    "Invalid querystring parameters."
  )
  @JwtDecoder()
  @OrganisationRoleValidator(AccessorOrganisationRole.QUALIFYING_ACCESSOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest,
    auth: any
  ): Promise<void> {
    const accessorId = req.params.accessorId;
    const oid = context.auth.decodedJwt.oid;

    if (accessorId !== oid) {
      context.logger(
        `[${req.method}]${req.url} Operation denied. ${accessorId} !== ${oid}`,
        Severity.Information
      );
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    const query: any = req.query;
    if (query.order) {
      query.order = JSON.parse(query.order);
    }

    const filter = {
      ...query,
    };

    let result;
    try {
      const callResult = await persistence.findAllInnovationsByAccessor(
        context,
        accessorId,
        filter
      );

      const innovations = callResult[0] as Innovation[];

      result = {
        data: innovations?.map((inno: Innovation) => ({
          id: inno.id,
          status: inno.status,
          name: inno.name,
          supportStatus:
            inno.innovationSupports && inno.innovationSupports.length > 0
              ? inno.innovationSupports[0].status
              : InnovationSupportStatus.UNNASSIGNED,
          createdAt: inno.createdAt,
          updatedAt: inno.updatedAt,
          assessment:
            inno.assessments.length > 0
              ? { id: inno.assessments[0].id }
              : { id: null },
        })),
        count: callResult[1],
      };
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
