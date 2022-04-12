import Joi = require("joi");

const payloadSchema = Joi.object({
  newOrganisationUnitId: Joi.string().required(),
}).unknown(true);

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};
