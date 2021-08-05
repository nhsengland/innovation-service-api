import Joi = require("joi");

const payloadSchema = Joi.object({
  displayName: Joi.string().required(),
  mobilePhone: Joi.string().optional(),
  organisation: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().allow(null).allow("").optional(),
    isShadow: Joi.boolean().optional(),
    size: Joi.string().allow(null).allow("").optional(),
  }).optional(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
