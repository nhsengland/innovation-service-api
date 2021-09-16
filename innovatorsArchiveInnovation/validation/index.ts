import Joi = require("joi");

const payloadSchema = Joi.object({
  reason: Joi.string().allow(null).allow("").optional(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
