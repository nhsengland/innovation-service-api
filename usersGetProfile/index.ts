import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { decodeToken } from "../utils/authentication";
import * as persistence from "./persistence";
import {
  AllowedUserType,
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import { CustomContext, Severity } from "../utils/types";
import { UserType } from "@domain/index";
import { ProfileModel } from "@services/models/ProfileModel";

class UsersGetProfile {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidateHeaders, "headers", "Invalid Headers")
  @JwtDecoder()
  @AllowedUserType(
    UserType.ACCESSOR,
    UserType.ADMIN,
    UserType.ASSESSMENT,
    UserType.INNOVATOR
  )
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const externalId = context.auth.requestUser.externalId;
    const id = context.auth.requestUser.id;

    let result: ProfileModel;

    try {
      result = await persistence.getProfile(context, id, externalId);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
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
