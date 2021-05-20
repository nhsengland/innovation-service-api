import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { decodeToken } from "../utils/authentication";
import * as persistence from "./persistence";
import {
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";

class UsersGetProfile {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidateHeaders, "headers", "Invalid Headers")
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const id = context.auth.decodedJwt.oid;

    let result;

    try {
      result = await persistence.getProfile(context, id);
    } catch (error) {
      context.logger(
        `[${req.method}] ${req.url}`,
        Severity.Error,
        { error },
        error
      );
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
