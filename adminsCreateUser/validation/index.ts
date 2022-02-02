import Joi = require("joi");

const payloadSchema = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().optional(),
  organisationAcronym: Joi.string().optional(),
  organisationUnitAcronym: Joi.string().optional(),
  role: Joi.string().optional(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
