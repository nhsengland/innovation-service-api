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

class AssessmentsCreateInnovationAssessment {
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
    const userId = req.params.userId;
    const innovationId = req.params.innovationId;
    const oid = context.auth.decodedJwt.oid;

    if (userId !== oid) {
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      result = await persistence.createInnovationAssessment(
        context,
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

    context.res = Responsify.Created({ id: result.id });
  }
}

export default AssessmentsCreateInnovationAssessment.httpTrigger;
