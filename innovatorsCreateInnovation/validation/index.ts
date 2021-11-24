import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().max(constants.smallFieldCharacterLimit).required(),
  countryName: Joi.string().required(),
  postcode: Joi.string().allow(null).allow("").optional(),
  organisationShares: Joi.array().items(Joi.string()).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
