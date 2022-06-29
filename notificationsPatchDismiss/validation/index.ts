import { NotifContextPayloadType } from "@domain/enums/notification.enums";
import Joi = require("joi");

export type BodyParamsType = {
  notificationIds?: string[];
  context?: NotifContextPayloadType;
  dismissAll?: boolean;
};

export const BodySchema = Joi.alternatives().try(
  Joi.object<BodyParamsType>({
    notificationIds: Joi.array().items(Joi.string().guid()).required(),
  }),
  Joi.object<BodyParamsType>({
    context: Joi.object().required(),
  }),
  Joi.object<BodyParamsType>({
    dismissAll: Joi.boolean().required(),
  })
);
