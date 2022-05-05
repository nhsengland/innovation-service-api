import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  name: Joi.string().max(constants.mediumFieldCharacterLimit).required(),
  touType: Joi.string().required(),
  summary: Joi.string().allow(null).allow("").optional(),
  releasedAt: Joi.string().allow(null).allow("").optional(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
