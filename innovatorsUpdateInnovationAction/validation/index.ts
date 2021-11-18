import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  status: Joi.string().required(),
  comment: Joi.string()
    .max(constants.mediumFieldCharacterLimit)
    .allow(null)
    .allow("")
    .required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
