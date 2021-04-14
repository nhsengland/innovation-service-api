import Joi = require("joi");

const querySchema = Joi.object({
  type: Joi.string().required(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
