import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  section: Joi.string().required(),
  data: Joi.object({
    problemsTackled: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    problemsConsequences: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    intervention: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    interventionImpact: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    cliniciansImpactDetails: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    accessibilityImpactDetails: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    accessibilityStepsDetails: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    marketResearch: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    potentialPathway: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    userTests: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow("").optional(),
        kind: Joi.string().allow(null).allow("").optional(),
        feedback: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
      })
    ),
    deploymentPlans: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow("").optional(),
        name: Joi.string().allow(null).allow("").optional(),
        commercialBasis: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
        orgDeploymentAffect: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
      })
    ),
    subgroups: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow("").optional(),
        name: Joi.string().allow(null).allow("").optional(),
        costDescription: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
        patientsRange: Joi.string().allow(null).allow("").optional(),
        sellExpectations: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
        usageExpectations: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
        carePathway: Joi.string().allow(null).allow("").optional(),
        conditions: Joi.string()
          .max(constants.mediumFieldCharacterLimit)
          .allow(null)
          .allow("")
          .optional(),
        otherCondition: Joi.string().allow(null).allow("").optional(),
        otherBenefit: Joi.string().allow(null).allow("").optional(),
        costComparison: Joi.string().allow(null).allow("").optional(),
        benefits: Joi.array().items(
          Joi.string().allow(null).allow("").optional()
        ),
      })
    ),
    standards: Joi.array().items(
      Joi.object({
        id: Joi.string().allow(null).allow("").optional(),
        type: Joi.string().required(),
        hasMet: Joi.string().allow(null).allow("").optional().optional(),
      })
    ),
    costDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    sellExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    usageExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    subGroupCostDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    subGroupSellExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    subGroupUsageExpectations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    payingOrganisations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    benefittingOrganisations: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    fundingDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
    moreSupportDescription: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .allow(null)
      .allow("")
      .optional(),
  })
    .required()
    .unknown(true),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
