import { UserType } from "@domain/index";
import Joi = require("joi");

const querySchema = Joi.object({
  type: Joi.string()
    .allow(UserType.ACCESSOR, UserType.ASSESSMENT, UserType.INNOVATOR)
    .optional(),
  email: Joi.string().optional(),
  code: Joi.string().optional(),
  id: Joi.string().optional(),
}).unknown(true);

export const ValidateQuerySchema = (data: object): any => {
  return querySchema.validate(data);
};
