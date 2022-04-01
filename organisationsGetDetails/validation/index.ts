import Joi = require("joi");

const paramSchema = Joi.object({
  organisationId: Joi.string().required(),
});

export const ValidateParams = (data: object): any => {
  return paramSchema.validate(data);
};
