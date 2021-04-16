import Joi = require("joi");

const querySchema = Joi.object({
  pagination: Joi.object({
    page: Joi.string().required(),
    rows: Joi.string().required(),
  }),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
