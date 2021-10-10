import Joi = require("joi");

const payloadSchema = Joi.object({
  notificationType: Joi.string().required(),
  isSubscribed: Joi.boolean().required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
