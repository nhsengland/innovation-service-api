import { AzureFunction, Context, HttpRequest } from "@azure/functions";

export default async function innovatorsUpdateInnovation(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  //
  const innovatorId = req.query.innovatorId;

  //
  const innovationId = req.query.innovationId;

  //
  const authorization = req.query.authorization;

  // Innovation Update Payload
  const body = JSON.parse(req.body);

  // Default response code is 200.
  context.res = { body: "Successfully Setup" };
}
