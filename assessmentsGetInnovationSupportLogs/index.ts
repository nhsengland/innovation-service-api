import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
import {
  AppInsights,
  JwtDecoder,
  AllowedUserType,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class AssessmentsGetInnovationSupportLogs {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const innovationId = req.params.innovationId;

    let result;
    try {
      result = await persistence.findAllInnovationSupportLogs(
        context,
        innovationId
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

export default AssessmentsGetInnovationSupportLogs.httpTrigger;
