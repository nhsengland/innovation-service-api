import { Context, HttpRequest } from "@azure/functions";
import jwt_decode from "jwt-decode";

import { UserService } from "nhs-aac-domain-services";

import * as Responsify from "../utils/responsify";
import { ValidateHeaders, ValidatePayload } from "./validation";

/*
	1 - Get graph api token
	2 - Call user update
*/
export default async function usersUpdateInfo(
  context: Context,
  req: HttpRequest
): Promise<void> {
  const payload = req.body;
  const payloadValidation = ValidatePayload(payload);

  const userService = new UserService();

  if (payloadValidation.error) {
    context.res = Responsify.BadData({ error: "Payload validation failed." });
    return;
  }

  const headersValidation = ValidateHeaders(req.headers);

  if (headersValidation.error) {
    context.res = Responsify.BadRequest({
      error: "Headers validation failed.",
    });
    return;
  }

  const token = req.headers.authorization;
  const jwt = jwt_decode(token) as any;
  const oid = jwt.oid;

  try {
    await userService.updateUserDisplayName(payload, oid);
    context.res = Responsify.NoContent();
  } catch (error) {
    context.res = Responsify.Internal();
  }
}
