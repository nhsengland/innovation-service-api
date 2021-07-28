import Joi = require("joi");

const payloadSchema = Joi.object({
  type: Joi.string().allow(null).allow("").required(),
  description: Joi.string().allow(null).allow("").required(),
  organisationUnits: Joi.array().items(Joi.string()).optional(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
