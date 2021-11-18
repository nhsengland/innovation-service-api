import * as constants from "../../utils/constants";
import Joi = require("joi");

const payloadSchema = Joi.object({
  status: Joi.string().allow(null).allow("").required(),
  comment: Joi.string()
    .max(constants.largeFieldCharacterLimit)
    .allow(null)
    .allow("")
    .required(),
  accessors: Joi.array().items(Joi.string()).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
