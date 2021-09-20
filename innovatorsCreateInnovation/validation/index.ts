import Joi = require("joi");

const payloadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  countryName: Joi.string().required(),
  postcode: Joi.string().allow(null).allow("").optional(),
  organisationShares: Joi.array().items(Joi.string()).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
