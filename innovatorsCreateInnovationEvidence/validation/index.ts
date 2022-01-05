import Joi = require("joi");
import * as constants from "../../utils/constants";

const payloadSchema = Joi.object({
  evidenceType: Joi.string().allow(null).allow("").required(),
  clinicalEvidenceType: Joi.string().allow(null).allow("").optional(),
  description: Joi.string().allow(null).allow("").required(),
  summary: Joi.string()
    .max(constants.mediumFieldCharacterLimit)
    .allow(null)
    .allow("")
    .required(),
  files: Joi.array().items(Joi.string()).required(),
})
  .required()
  .unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
