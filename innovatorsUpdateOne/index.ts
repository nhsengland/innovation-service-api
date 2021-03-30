import { AzureFunction, Context, HttpRequest } from "@azure/functions";

export default async function innovatorsUpdateOne(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  //
  const innovatorId = req.query.innovatorId;

  //
  const authorization = req.query.authorization;

  // Innovator Update Payload
  const body = JSON.parse(req.body);

  // Default response code is 200.
  context.res = { body: "Successfully Setup" };
}
