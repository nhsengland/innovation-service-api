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
    const surveyItem = req.body;
    const validationRes = ValidatePayload(surveyItem);
    if (validationRes.error) {
      context.log.error(validationRes.error);
      context.res = Responsify.UnprocessableEntity({
        error: "Payload validation failed.",
      });
      return;
    }

    try {
      const result = await persistence.Save(surveyItem);
      const data = {
        id: persistence.GetId(result),
      };

      context.res = Responsify.Created(data);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal({
        error: "Error occured while saving to the datastore.",
      });
      return;
    }
  }
}

export default SurveyCreateOne.httpTrigger;
