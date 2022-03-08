import { AccessorOrganisationRole } from "@domain/index";
import Joi = require("joi");

const payloadSchema = Joi.object({
  role: Joi.string()
  .allow(AccessorOrganisationRole.ACCESSOR, AccessorOrganisationRole.QUALIFYING_ACCESSOR)
  .required(),
  code: Joi.string().optional(),
  id: Joi.string().optional(),
}).unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
