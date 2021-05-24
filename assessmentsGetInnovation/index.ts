import { HttpRequest } from "@azure/functions";
import * as persistence from "./persistence";
import * as Responsify from "../utils/responsify";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";
import { UserType } from "@services/index";

class AssessmentsGetInnovation {
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
      result = await persistence.getAssessmentInnovationSummary(
        context,
        innovationId
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AssessmentsGetInnovation.httpTrigger;
