import Joi = require("joi");

const payloadSchema = Joi.object({
  contextType: Joi.string().required(),
  contextId: Joi.string().required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
