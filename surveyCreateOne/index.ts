import { Context, HttpRequest } from "@azure/functions";
import { setupCosmosDb } from "../utils/connection";
import * as Responsify from "../utils/responsify";
import { ValidatePayload } from "./validation";
import * as persistence from "./persistence";

export default async function surveyCreateOne(
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await setupCosmosDb();
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal({
      error: "Error establishing connection with the datasource.",
    });
    return;
  }

  const surveyItem = req.body;
  const validationRes = ValidatePayload(surveyItem);
  if (validationRes.error) {
    context.log.error(validationRes.error);
    context.res = Responsify.BadData({ error: "Payload validation failed." });
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
