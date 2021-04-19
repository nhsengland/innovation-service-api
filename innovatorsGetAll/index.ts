import { HttpRequest } from "@azure/functions";
import {
  SQLConnector,
  JwtDecoder,
  OrganisationRoleValidator,
} from "../utils/decorators";
import { CustomContext } from "../utils/types";

class InnovatorsGetAll {
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
