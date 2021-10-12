import Joi = require("joi");

const querySchema = Joi.object({
  innovationStatus: Joi.string().allow(null, "").optional(),
  innovationSection: Joi.string().allow(null, "").optional(),
  name: Joi.string().allow(null, "").optional(),
  take: Joi.number().required(),
  skip: Joi.number().required(),  
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
