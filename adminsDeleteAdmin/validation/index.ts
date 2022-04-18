import { AccessorOrganisationRole } from "@domain/index";
import Joi = require("joi");

const payloadSchema = Joi.object({
  userEmail: Joi.string().required(),
}).unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
