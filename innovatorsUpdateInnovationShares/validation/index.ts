import Joi = require("joi");

const payloadSchema = Joi.object({
  organisations: Joi.array().items(Joi.string()).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
