import Joi = require("joi");

const payloadSchema = Joi.object({
  comment: Joi.string().allow(null).allow("").required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
