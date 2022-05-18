import { HttpRequest } from "@azure/functions";
import { User } from "@domain/index";
import { decodeToken } from "utils/authentication";
import {
  AppInsights,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";
class UsersGetProfile {
  @AppInsights()
  @SQLConnector()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const surveyId = req.body.surveyId;
    const idToken = req.body.idToken;

    const jwt = decodeToken(idToken);
    const externalId = jwt.sub;

    let result: User;

    try {
      result = await persistence.createProfile(context, surveyId, externalId);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    if (result) {
      context.res = Responsify.Ok({
        id: result.id,
        externalId: result.externalId,
      });
      return;
    }

    context.res = Responsify.NotFound();
  }
}

export default UsersGetProfile.httpTrigger;
