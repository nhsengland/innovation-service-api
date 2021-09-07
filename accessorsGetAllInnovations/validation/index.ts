import Joi = require("joi");

const querySchema = Joi.object({
  take: Joi.number().required(),
  skip: Joi.number().required(),
  supportStatus: Joi.string().required(),
  assignedToMe: Joi.boolean().optional(),
  suggestedOnly: Joi.boolean().optional(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
