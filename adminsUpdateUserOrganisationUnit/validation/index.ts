import Joi = require("joi");

const payloadSchema = Joi.object({
  newOrganisationUnitAcronym: Joi.string().required(),
  organisationId: Joi.string().required(),
}).unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
