import Joi = require("joi");

const payloadSchema = Joi.object({
  code: Joi.string().min(6).max(6),
}).required();

export const ValidatePayload = (data: any): any => {
  return payloadSchema.validate(data);
};
