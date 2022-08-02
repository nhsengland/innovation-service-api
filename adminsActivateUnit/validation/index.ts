import Joi = require("joi");

const payloadSchema = Joi.object({
  organisationUnitId: Joi.string()
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
