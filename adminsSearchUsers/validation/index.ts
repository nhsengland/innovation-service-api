import Joi = require("joi");

const querySchema = Joi.object({
  emails: Joi.string().required(),
}).unknown(true);

export const ValidateQuerySchema = (data: object): any => {
  return querySchema.validate(data);
};
