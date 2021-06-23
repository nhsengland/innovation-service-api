import Joi = require("joi");

const payloadSchema = Joi.object({
  comment: Joi.string().required(),
  replyTo: Joi.string().allow(null).allow("").optional(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
