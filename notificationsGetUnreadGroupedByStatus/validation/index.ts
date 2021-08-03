import Joi = require("joi");

const querySchema = Joi.object({
  scope: Joi.string().allow("INNOVATION_STATUS", "SUPPORT_STATUS").required(),
}).unknown(true);

export const ValidateQueryParams = (data: object): any => {
  return querySchema.validate(data);
};
