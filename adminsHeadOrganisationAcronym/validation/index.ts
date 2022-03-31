import Joi = require("joi");

const querySchema = Joi.object({
  acronym: Joi.string().required(),
  organisationId: Joi.string().required(),
  code: Joi.string().optional(),
}).required();

export const ValidateQuerySchema = (data: object): any => {
  return querySchema.validate(data);
};
