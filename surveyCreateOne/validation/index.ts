import Joi = require("joi");

const payloadSchema = Joi.object()
  .pattern(
    Joi.string().max(50),
    Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.string()),
      Joi.number()
    )
  )
  .required();

export const ValidatePayload = (data: any): any => {
  return payloadSchema.validate(data);
};
