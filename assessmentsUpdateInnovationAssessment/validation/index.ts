import Joi = require("joi");

const payloadSchema = Joi.object({
  id: Joi.string().allow(null).allow("").optional(),
  description: Joi.string().allow(null).allow("").optional(),
  assignToName: Joi.string().allow(null).allow("").optional(),
  innovation: Joi.string().allow(null).allow("").optional(),
  summary: Joi.string().allow(null).allow("").optional(),
  maturityLevel: Joi.string().allow(null).allow("").optional(),
  hasRegulatoryApprovals: Joi.string().allow(null).allow("").optional(),
  hasRegulatoryApprovalsComment: Joi.string().allow(null).allow("").optional(),
  hasEvidence: Joi.string().allow(null).allow("").optional(),
  hasEvidenceComment: Joi.string().allow(null).allow("").optional(),
  hasValidation: Joi.string().allow(null).allow("").optional(),
  hasValidationComment: Joi.string().allow(null).allow("").optional(),
  hasProposition: Joi.string().allow(null).allow("").optional(),
  hasPropositionComment: Joi.string().allow(null).allow("").optional(),
  hasCompetitionKnowledge: Joi.string().allow(null).allow("").optional(),
  hasCompetitionKnowledgeComment: Joi.string().allow(null).allow("").optional(),
  hasImplementationPlan: Joi.string().allow(null).allow("").optional(),
  hasImplementationPlanComment: Joi.string().allow(null).allow("").optional(),
  hasScaleResource: Joi.string().allow(null).allow("").optional(),
  hasScaleResourceComment: Joi.string().allow(null).allow("").optional(),
  organisationUnits: Joi.array().items(Joi.string()).optional(),
  isSubmission: Joi.boolean().optional(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
