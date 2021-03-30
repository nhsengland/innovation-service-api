import { Context, HttpRequest } from "@azure/functions";
import { Innovator, Innovation, Organisation } from "nhs-aac-domain-services";
import * as persistence from "./persistence";
import jwt_decode from "jwt-decode";
import * as Responsify from "../utils/responsify";
import { ValidateHeaders, ValidatePayload } from "./validation";
import { setupSQLConnection } from "../utils/connection";

export default async function innovatorsCreateOne(
  context: Context,
  req: HttpRequest
): Promise<void> {
  /*
      1 - GET OID  FROM JWT
      2 - GET REQ BODY
      3 - VALIDATE ACTION_TYPE PROPERTY FROM BODY (MUST BE FIRST_TIME_SIGNIN OR INVITE)
      4 - IF FIRST_TIME_SIGNING, VALIDATES PAYLOAD AGAINST FIRST_TIME_SIGNIN JOI SCHEMA
      5 - IF INVITE, VALIDATES PAYLOAD AGAINST INVITE JOI SCHEMA

      - BEGIN TRANSACTION
      
      6 - CREATE INNOVATOR ENTITY AND ASSIGN OID AND SURVEYID 
      7 - CREATE ORGANIZATION ENTITY AND ADD INNOVATOR AS MEMBER
      8 - CREATE INNOVATION ENTITY AND ASSIGN INNOVATOR AS OWNER
      9 - DONE
      

      - END TRANSACTION
  */
  try {
    await setupSQLConnection();
  } catch (error) {
    context.log(error);
    context.res = Responsify.Internal({
      error: "Error establishing connection with the datasource.",
    });
    return;
  }

  context.log("Database connection established");

  const payload = req.body;
  const payloadValidation = ValidatePayload(payload);

  if (payloadValidation.error) {
    context.log(payloadValidation.error);
    context.res = Responsify.BadData({ error: "Payload validation failed." });
    return;
  }

  context.log("Payload validation succeeded");

  const headersValidation = ValidateHeaders(req.headers);

  if (headersValidation.error) {
    context.log(headersValidation.error);
    context.res = Responsify.BadRequest({
      error: "Headers validation failed.",
    });
    return;
  }

  context.log("Headers validation succeeded");

  const token = req.headers.authorization;
  const jwt = jwt_decode(token) as any;
  const oid = jwt.oid;

  context.log(oid);

  try {
    await persistence.updateUserDisplayName({ user: payload.user, oid });
    context.log("Updated User display name");
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal();
    return;
  }

  if (payload.actionType === "first_time_signin" && !payload.organisation) {
    payload.organisation = Organisation.new({
      name: oid,
      isShadow: true,
    });
  }

  try {
    const innovator: Innovator = Innovator.new({ ...payload.innovator, oid });
    const innovation: Innovation = Innovation.new({ ...payload.innovation });
    const organisation: Organisation = Organisation.new({
      ...payload.organisation,
    });

    const result = await persistence.createInnovator(
      innovator,
      innovation,
      organisation
    );

    context.res = Responsify.Created(result);
    context.log("Innovator was created");
  } catch (error) {
    context.log.error(error);
    context.res = Responsify.Internal();
    return;
  }
}
