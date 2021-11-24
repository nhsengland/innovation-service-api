import Joi = require("joi");

const payloadSchema = Joi.array().items(Joi.string()).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
