import Joi = require("joi");

const payloadSchema = Joi.object({
  innovationId: Joi.string().required(),
  email: Joi.string().required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
