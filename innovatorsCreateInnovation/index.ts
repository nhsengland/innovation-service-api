import { Context, HttpRequest } from "@azure/functions";

export default async function innovatorsCreateInnovation(
  context: Context
  //req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  // Default response code is 200.
  context.res = { body: "Successfully Setup" };
}
