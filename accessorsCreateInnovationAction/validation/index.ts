import * as constants from "../../utils/constants";
import Joi = require("joi");

const payloadSchema = Joi.object({
  description: Joi.string().max(constants.mediumFieldCharacterLimit).required(),
  section: Joi.string().required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
