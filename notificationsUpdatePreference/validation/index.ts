import Joi = require("joi");

const payloadSchema = Joi.array()
  .items(
    Joi.object({
      notificationType: Joi.string().required(),
      preference: Joi.string().required(),
    })
  )
  .required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
