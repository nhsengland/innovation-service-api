import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import {
  JwtDecoder,
  OrganisationRoleValidator,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext } from "../utils/types";
import { AccessorOrganisationRole, Innovation } from "nhs-aac-domain-services";

class AccessorsGetAllInnovations {
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

      // TODO : remove after accessor assign task
      const tmpStatusList = [
        "UNNASSIGNED",
        "FURTHER_INFO_REQUIRED",
        "WAITING",
        "ENGAGING",
      ];
      // end temporary code

      result = {
        data: innovations?.map((inno: Innovation) => ({
          id: inno.id,
          status: inno.status,
          name: inno.name,
          supportStatus: tmpStatusList[Math.floor(Math.random() * 4)],
          createdAt: inno.createdAt,
          updatedAt: inno.updatedAt,
        })),
        count: callResult[1],
      };
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AccessorsGetAllInnovations.httpTrigger;
