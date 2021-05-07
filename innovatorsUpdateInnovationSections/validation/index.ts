import Joi = require("joi");

const payloadSchema = Joi.object({
  section: Joi.string().required(),
  isSubmission: Joi.boolean().required(),
  data: Joi.object().required().unknown(true),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
