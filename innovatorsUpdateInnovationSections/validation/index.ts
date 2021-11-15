import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  section: Joi.string().required(),
  data: Joi.object({
    problemsTackled: Joi.string().max(constants.mediumFieldCharacterLimit),
    problemsConsequences: Joi.string().max(constants.mediumFieldCharacterLimit),
    intervention: Joi.string().max(constants.mediumFieldCharacterLimit),
    interventionImpact: Joi.string().max(constants.mediumFieldCharacterLimit),
    cliniciansImpactDetails: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    accessibilityImpactDetails: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    accessibilityStepsDetails: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    marketResearch: Joi.string().max(constants.mediumFieldCharacterLimit),
    potentialPathway: Joi.string().max(constants.mediumFieldCharacterLimit),
    userTestFeedback: Joi.string().max(constants.mediumFieldCharacterLimit),
    costDescription: Joi.string().max(constants.mediumFieldCharacterLimit),
    sellExpectations: Joi.string().max(constants.mediumFieldCharacterLimit),
    usageExpectations: Joi.string().max(constants.mediumFieldCharacterLimit),
    subGroupCostDescription: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    subGroupSellExpectations: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    subGroupUsageExpectations: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    payingOrganisations: Joi.string().max(constants.mediumFieldCharacterLimit),
    benefittingOrganisations: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    fundingDescription: Joi.string().max(constants.mediumFieldCharacterLimit),
    deploymentPlansComercialBasis: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
    deploymentPlansOrgDeploymentAffect: Joi.string().max(
      constants.mediumFieldCharacterLimit
    ),
  })
    .required()
    .unknown(true),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
