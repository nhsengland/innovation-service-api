import { AzureFunction, Context, HttpRequest } from "@azure/functions";

export default async function innovatorsDeleteOne(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  //
  const innovatorId = req.query.innovatorId;

  //
  const authorization = req.query.authorization;

  // Default response code is 200.
  context.res = { body: "Successfully Setup" };
}
