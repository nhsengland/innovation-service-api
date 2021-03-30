import Joi = require("joi");

const payloadSchema = Joi.object({
  displayName: Joi.string().required(),
}).required();

const headersSchema = Joi.object({
  authorization: Joi.string().required(),
})
  .unknown(true)
  .required();

export const ValidatePayload = (data: any): any => {
  return payloadSchema.validate(data);
};

export const ValidateHeaders = (data: any): any => {
  return headersSchema.validate(data);
};
