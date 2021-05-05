import Joi = require("joi");

const headersSchema = Joi.object({
  authorization: Joi.string().required(),
})
  .unknown(true)
  .required();

export const ValidateHeaders = (data: object): any => {
  return headersSchema.validate(data);
};
