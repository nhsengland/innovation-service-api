import Joi = require("joi");

const payloadSchema = Joi.object({
  description: Joi.string().required(),
  section: Joi.string().required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
