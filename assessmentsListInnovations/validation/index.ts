import { number } from "joi";
import Joi = require("joi");

const querySchema = Joi.object({
  status: Joi.string().required(),
  skip: Joi.number().required(),
  take: Joi.number().required(),
  order: Joi.string().optional(),
  supportFilter: Joi.string().optional(),
}).required();

export const ValidateQuery = (data: object): any => {
  return querySchema.validate(data);
};
