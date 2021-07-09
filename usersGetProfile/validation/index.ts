import Joi = require("joi");

const headerSchema = Joi.object({
  authorization: Joi.string().required(),
}).unknown(true);

export const ValidateHeaders = (data: object): any => {
  return headerSchema.validate(data);
};
