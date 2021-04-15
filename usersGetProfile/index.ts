import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { decodeToken } from "../utils/authentication";
import * as persistence from "./persistence";
import { SetupConnection, Validate } from "../utils/decorators";

class UsersGetProfile {
  @SetupConnection()
  @Validate(validation.ValidateHeaders, "headers", "Invalid Headers")
  static async httpTrigger(context: Context, req: HttpRequest): Promise<void> {
    const token = req.headers.authorization;
    const jwt = decodeToken(token);
    const id = jwt.oid;

    let result;

    try {
      result = await persistence.getProfile(id);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    if (result) {
      context.res = Responsify.Ok(result);
      return;
    }

    context.res = Responsify.NotFound();
  }
}

export default UsersGetProfile.httpTrigger;
