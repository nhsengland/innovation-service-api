import Joi = require("joi");

const payloadSchema = Joi.object({
  reason: Joi.string().required(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
