import { HttpRequest } from "@azure/functions";
import { UserType } from "@domain/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";

class InnovatorsGetInnovationAssessment {
  @AppInsights()
  @SQLConnector()
  @JwtDecoder()
  @AllowedUserType(UserType.INNOVATOR)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const assessmentId = req.params.assessmentId;
    const innovatorId = req.params.userId;
    const innovationId = req.params.innovationId;

    let result;
    try {
      result = await persistence.findInnovationAssessmentById(
        context,
        assessmentId,
        innovationId,
        innovatorId
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

export default InnovatorsGetInnovationAssessment.httpTrigger;
