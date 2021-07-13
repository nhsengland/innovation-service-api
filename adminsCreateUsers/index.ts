import { HttpRequest } from "@azure/functions";
import { UserType } from "@services/index";
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

class AdminsCreateUsers {
  @AppInsights()
  @SQLConnector()
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
    req: HttpRequest
  ): Promise<void> {
    const users = req.body;
    const adminId = process.env.ADMIN_OID;
    const oid = context.auth.decodedJwt.oid;

    if (oid !== adminId) {
      context.logger(
        `[${req.method}]${req.url} Operation denied. ${oid} !== adminId`,
        Severity.Information
      );
      context.res = Responsify.Forbidden({ error: "Operation denied." });
      return;
    }

    let result;
    try {
      context.auth.requestUser = {
        id: oid,
        type: UserType.ADMIN,
      };

      result = await persistence.createUsers(context, users);
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.ErroHandling(error);
      return;
    }

    context.res = Responsify.Ok(result);
  }
}

export default AdminsCreateUsers.httpTrigger;
