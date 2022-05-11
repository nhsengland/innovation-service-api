import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class termsOfUseAccept {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  // @AllowedUserType(UserType.ASSESSMENT, UserType.ACCESSOR, UserType.INNOVATOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    let result;
    try {
      result = await persistence.termsOfUseCheckIfUserAccepted(context);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound();
  }
}

export default termsOfUseAccept.httpTrigger;
