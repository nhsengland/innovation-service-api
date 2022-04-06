import Joi = require("joi");

const paramSchema = Joi.object({
  organisationUnitId: Joi.string().required(),
});

export const ValidateParams = (data: object): any => {
  return paramSchema.validate(data);
};
