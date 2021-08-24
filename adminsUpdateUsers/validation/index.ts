import Joi = require("joi");

const payloadSchema = Joi.array()
  .items(
    Joi.object({
      id: Joi.string().required(),
      properties: Joi.object().required().unknown(true),
    })
  )
  .required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
