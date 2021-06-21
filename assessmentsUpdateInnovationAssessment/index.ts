import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class AssessmentsUpdateInnovationAssessment {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  @AllowedUserType(UserType.ASSESSMENT)
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const assessment = req.body;
    const id = req.params.assessmentId;
    const userId = req.params.userId;
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    if (userId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    assessment.innovation = innovationId;
    assessment.assignTo = userId;

    let result;
    try {
      result = await persistence.updateInnovationAssessment(
        context,
        id,
        userId,
        innovationId,
        assessment
      );
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok({ id: result.id });
  }
}

export default AssessmentsUpdateInnovationAssessment.httpTrigger;
