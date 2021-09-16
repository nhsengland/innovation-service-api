import Joi = require("joi");

const querySchema = Joi.object({
  take: Joi.number().required(),
  skip: Joi.number().required(),
  status: Joi.string().allow(null, "").optional(),
  assignedToMe: Joi.boolean().optional(),
  suggestedOnly: Joi.boolean().optional(),
  name: Joi.string().allow(null, "").optional(),
  cat: Joi.string().allow(null, "").optional(),
  loc: Joi.string().allow(null, "").optional(),
  org: Joi.string().allow(null, "").optional(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
