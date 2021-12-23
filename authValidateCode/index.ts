import { HttpRequest } from "@azure/functions";
import { AppInsights, CosmosConnector } from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext } from "../utils/types";
import * as persistence from "./persistence";
import { ValidatePayload } from "./validation";

class SurveyCreateOne {
  @AppInsights()
  @CosmosConnector()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const codeItem = req.body;
    const validationRes = ValidatePayload(codeItem);
    if (validationRes.error) {
      context.log.error(validationRes.error);
      context.res = Responsify.UnprocessableEntity({
        error: "Payload validation failed.",
      });
      return;
    }

    try {
      const result = await persistence.validate(context, codeItem);

      context.res = Responsify.Ok(result);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal({
        error: "Error occured while validating TOTP.",
      });
      return;
    }
  }
}

export default SurveyCreateOne.httpTrigger;
