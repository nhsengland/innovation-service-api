import Joi = require("joi");

const payloadSchema = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().allow(null).allow("").optional(),
  organisationAcronym: Joi.string().allow(null).allow("").optional(),
  organisationUnitAcronym: Joi.string().allow(null).allow("").optional(),
  role: Joi.string().allow(null).allow("").optional(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
