import { Context, HttpRequest } from "@azure/functions";
import { Survey } from "../schemas/Survey";
import { setupCosmosDb } from "../utils/connection";
import * as Responsify from "../utils/responsify";

export default async function surveyGetOne(
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await setupCosmosDb();
  } catch (error) {
    context.res = Responsify.Internal({
      error: "Error establishing connection with the datasource.",
    });
    return;
  }

  const surveyId = req.params.surveyId;

  const result = await Survey.findById(surveyId);

  context.res = Responsify.Ok(result.toJSON());
}
