import Joi = require("joi");

const querySchema = Joi.object({
  email: Joi.string().required(),
  code: Joi.string().optional(),
  id: Joi.string().optional(),
}).required();

export const ValidateQuerySchema = (data: object): any => {
  return querySchema.validate(data);
};
