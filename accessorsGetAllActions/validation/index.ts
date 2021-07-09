import Joi = require("joi");

const querySchema = Joi.object({
  openActions: Joi.boolean().required(),
  take: Joi.number().required(),
  skip: Joi.number().required(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
