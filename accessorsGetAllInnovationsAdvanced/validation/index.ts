import Joi = require("joi");

const querySchema = Joi.object({
  take: Joi.number().required(),
  skip: Joi.number().required(),
  supportStatuses: Joi.string().optional(),
  assignedToMe: Joi.boolean().optional(),
  suggestedOnly: Joi.boolean().optional(),
  name: Joi.string().optional(),
  categories: Joi.string().optional(),
  locations: Joi.string().optional(),
  organisations: Joi.string().optional(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
