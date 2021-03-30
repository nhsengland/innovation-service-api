import Joi = require("joi");

const payloadSchema = Joi.object({
  actionType: Joi.string().valid("first_time_signin", "invitation").required(),
  innovator: Joi.object({
    surveyId: Joi.string().required(),
  }),
  innovation: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    countryName: Joi.string().required(),
    postcode: Joi.string().allow(null).allow("").optional(),
  }),
  organisation: Joi.object({
    name: Joi.string().required(),
    size: Joi.string().optional(),
    id: Joi.string().when("action_type", {
      is: "invitation",
      then: Joi.string().required(),
    }),
  }).optional(),
  user: Joi.object({
    displayName: Joi.string().required(),
  }),
}).required();

const headersSchema = Joi.object({
  authorization: Joi.string().required(),
})
  .unknown(true)
  .required();

export const ValidatePayload = (data: object): any => {
  return payloadSchema.validate(data);
};

export const ValidateHeaders = (data: object): any => {
  return headersSchema.validate(data);
};
