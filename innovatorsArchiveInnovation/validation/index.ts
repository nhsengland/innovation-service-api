import Joi = require("joi");

const payloadSchema = Joi.object({
  reason: Joi.string().optional(),
}).optional();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
