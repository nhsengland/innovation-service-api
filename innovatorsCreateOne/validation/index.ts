import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  actionType: Joi.string().valid("first_time_signin", "transfer").required(),
  innovation: Joi.object({
    name: Joi.string().required(),
    description: Joi.string()
      .max(constants.mediumFieldCharacterLimit)
      .required(),
    countryName: Joi.string().required(),
    postcode: Joi.string().allow(null).allow("").optional(),
    organisationShares: Joi.array().items(Joi.string()).required(),
  }).when("action_type", {
    is: "first_time_signin",
    then: Joi.object().required(),
  }),
  transferId: Joi.string().when("action_type", {
    is: "transfer",
    then: Joi.string().required(),
  }),
  organisation: Joi.object({
    name: Joi.string().required(),
    size: Joi.string().optional(),
  }).optional(),
  user: Joi.object({
    displayName: Joi.string().required(),
    mobilePhone: Joi.string().allow(null).allow("").optional(),
  }),
}).required();

const headersSchema = Joi.object({
  authorization: Joi.string().required(),
})
  .unknown(true)
  .required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};

export const ValidateHeaders = (data: object): any => {
  return headersSchema.validate(data);
};
