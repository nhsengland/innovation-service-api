import { Context, HttpRequest } from "@azure/functions";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { decodeToken } from "../utils/authentication";
import * as persistence from "./persistence";
import { SetupConnection, Validate } from "../utils/decorators";

class UsersGetProfile {
  @SetupConnection()
  @Validate(validation.ValidateHeaders, "Invalid Headers")
  static async httpTrigger(ctx: Context, req: HttpRequest): Promise<void> {
    const token = req.headers.authorization;
    const jwt = decodeToken(token);
    const id = jwt.oid;

    let result;

    try {
      result = await persistence.getProfile(id);
    } catch (error) {
      ctx.log.error(error);
      ctx.res = Responsify.Internal();
      return;
    }

    ctx.res = Responsify.Ok(result);
  }
}

export default UsersGetProfile.httpTrigger;
