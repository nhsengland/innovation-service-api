import Joi = require("joi");

const payloadSchema = Joi.array()
  .items(
    Joi.object({
      notificationType: Joi.string().required(),
      isSubscribed: Joi.boolean().required(),
    })
  )
  .required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
