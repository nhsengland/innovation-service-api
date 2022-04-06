import Joi = require("joi");

const payloadSchema = Joi.object({
  name: Joi.string().required(),
  acronym: Joi.string().required(),
}).unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
