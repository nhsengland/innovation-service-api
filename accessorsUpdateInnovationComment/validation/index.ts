import * as constants from "../../utils/constants";
import Joi = require("joi");

const payloadSchema = Joi.object({
  comment: Joi.string().max(constants.largeFieldCharacterLimit).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
