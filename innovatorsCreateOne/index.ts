import { HttpRequest } from "@azure/functions";
import { Innovation, Organisation, User } from "@services/index";
import {
  AppInsights,
  CosmosConnector,
  JwtDecoder,
  SQLConnector,
  Validator,
} from "../utils/decorators";
import * as Responsify from "../utils/responsify";
import { CustomContext, Severity } from "../utils/types";
import * as persistence from "./persistence";
import * as validation from "./validation";

class InnovatorsCreateOne {
  @AppInsights()
  @SQLConnector()
  @CosmosConnector()
  @Validator(validation.ValidateHeaders, "headers", "Invalid Headers")
  @Validator(validation.ValidatePayload, "body", "Invalid Payload")
  @JwtDecoder()
  static async httpTrigger(
    context: CustomContext,
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
    const payload = req.body;
    const jwt = context.auth.decodedJwt;
    const oid = jwt.oid;
    const surveyId = jwt.surveyId;

    if (!surveyId) {
      context.res = Responsify.BadRequest({
        error: "SurveyId missing from JWT.",
      });
      return;
    }

    let survey: any;
    try {
      survey = await persistence.getSurvey(surveyId);
    } catch (error) {
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }

    if (!survey) {
      context.res = Responsify.BadRequest({
        error: "Survey not found!",
      });
      return;
    }

    const surveyAnswers = survey.answers;

    const getTypeObjectArray: Function = (types: String[]) => {
      return types?.map((type: String) => ({
        type,
        createdBy: oid,
        updatedBy: oid,
      }));
    };

    const surveyInfo = {
      mainCategory: surveyAnswers.get("mainCategory"),
      otherMainCategoryDescription: surveyAnswers.get(
        "otherMainCategoryDescription"
      ),
      hasProblemTackleKnowledge: surveyAnswers.get("hasProblemTackleKnowledge"),
      hasMarketResearch: surveyAnswers.get("hasMarketResearch"),
      hasBenefits: surveyAnswers.get("hasBenefits"),
      hasTests: surveyAnswers.get("hasTests"),
      hasEvidence: surveyAnswers.get("hasEvidence"),
      otherCategoryDescription: surveyAnswers.get("otherCategoryDescription"),
      categories: getTypeObjectArray(surveyAnswers.get("categories")),
      supportTypes: getTypeObjectArray(surveyAnswers.get("supportTypes")),
    };

    try {
      await persistence.updateUserDisplayName(context, {
        user: payload.user,
        oid,
      });
      context.log.info("Updated User display name");
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
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
        ...surveyInfo,
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
        context,
        innovator,
        innovation,
        organisation
      );

      context.res = Responsify.Created(result);
      context.log.info("Innovator was created");
    } catch (error) {
      context.logger(`[${req.method}] ${req.url}`, Severity.Error, { error });
      context.log.error(error);
      context.res = Responsify.Internal();
      return;
    }
  }
}

export default InnovatorsCreateOne.httpTrigger;
