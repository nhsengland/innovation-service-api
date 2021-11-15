import * as constants from "../../utils/constants";
import Joi = require("joi");

const payloadSchema = Joi.object({
  reason: Joi.string()
    .max(constants.largeFieldCharacterLimit)
    .allow(null)
    .allow("")
    .optional(),
}).required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
