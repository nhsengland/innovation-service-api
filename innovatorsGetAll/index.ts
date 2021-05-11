import { HttpRequest } from "@azure/functions";
import {
  SQLConnector,
  JwtDecoder,
  OrganisationRoleValidator,
  AppInsights,
} from "../utils/decorators";
import { CustomContext } from "../utils/types";

class InnovatorsGetAll {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @OrganisationRoleValidator("QUALIFYING_ACCESSOR")
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    context.log(context.auth.userOrganisations);
  }
}

export default InnovatorsGetAll.httpTrigger;
