import { Context, HttpRequest } from "@azure/functions";
import { User, Innovation, Organisation } from "nhs-aac-domain-services";
import * as persistence from "./persistence";
import jwt_decode from "jwt-decode";
import * as Responsify from "../utils/responsify";
import * as validation from "./validation";
import { setupSQLConnection } from "../utils/connection";
import { SetupConnection, Validate } from "../utils/decorators";

class InnovatorsCreateOne {
  @SetupConnection()
  @Validate(validation.ValidateHeaders, "headers", "Invalid Headers")
  @Validate(validation.ValidatePayload, "body", "Invalid Payload")
  static async httpTrigger(context: Context, req: HttpRequest): Promise<void> {
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
    const payload = req.body;
    const token = req.headers.authorization;
    const jwt = jwt_decode(token) as any;
    const oid = jwt.oid;

    const surveyId = jwt.extension_surveyId;
    if (!surveyId) {
      context.res = Responsify.BadRequest({
        error: "SurveyId missing from JWT.",
      });
      return;
    }

    try {
      await persistence.updateUserDisplayName({ user: payload.user, oid });
      context.log.info("Updated User display name");
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
      const innovator: User = User.new({ id: oid });
      const organisationShares = payload.innovation.organisationShares.map(
        (id) => {
          return { id };
        }
      );

      const innovation: Innovation = Innovation.new({
        name: payload.innovation.name,
        description: payload.innovation.description,
        countryName: payload.innovation.countryName,
        postcode: payload.innovation.postcode,
        surveyId,
        organisationShares,
      });
      const organisation: Organisation = Organisation.new({
        ...payload.organisation,
      });

      const result = await persistence.createInnovator(
        innovator,
        innovation,
        organisation
      );

      context.res = Responsify.Created(result);
      context.log.info("Innovator was created");
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }
  }
}

export default InnovatorsCreateOne.httpTrigger;
