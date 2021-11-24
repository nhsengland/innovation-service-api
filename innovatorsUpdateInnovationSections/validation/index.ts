import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  section: Joi.string().required(),
  data: Joi.object({
    problemsTackled: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    problemsConsequences: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    intervention: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    interventionImpact: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    cliniciansImpactDetails: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    accessibilityImpactDetails: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    accessibilityStepsDetails: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    marketResearch: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    potentialPathway: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    userTests: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow(""),
        kind: Joi.string().allow(null).allow(""),
        feedback: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow(""),
      })
    ),
    deploymentPlans: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow(""),
        name: Joi.string().allow(null).allow(""),
        commercialBasis: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow(""),
        orgDeploymentAffect: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow(""),
      })
    ),
    subgroups: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow(""),
        name: Joi.string().allow(null).allow(""),
        costDescription: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow(""),
        patientsRange: Joi.string().allow(null).allow(""),
        sellExpectations: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow(""),
        usageExpectations: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow(""),
      })
    ),
    costDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    sellExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    usageExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    subGroupCostDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    subGroupSellExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    subGroupUsageExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    payingOrganisations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    benefittingOrganisations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
    fundingDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow(""),
  })
    .required()
    .unknown(true),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
