import Joi = require("joi");

const querySchema = Joi.object({
  section: Joi.string().optional(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
