import Joi = require("joi");

const payloadSchema = Joi.object({
  evidenceType: Joi.string().allow(null).allow("").required(),
  clinicalEvidenceType: Joi.string().allow(null).allow("").required(),
  description: Joi.string().allow(null).allow("").required(),
  summary: Joi.string().allow(null).allow("").required(),
  files: Joi.array().items(Joi.string()).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
