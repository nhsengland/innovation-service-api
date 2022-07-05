import { NotifContextType } from "@domain/enums/notification.enums";
import Joi = require("joi");
import { JoiHelper, PaginationQueryParamsType } from "../../utils/joi.helper";

enum orderFields {
  createdAt = "createdAt",
}

export type QueryParamsType = PaginationQueryParamsType<orderFields> & {
  contextTypes?: NotifContextType;
  unreadOnly?: boolean;
};

export const QueryParamsSchema = JoiHelper.PaginationJoiSchema({
  orderKeys: Object.keys(orderFields),
})
  .append<QueryParamsType>({
    contextTypes: JoiHelper.AppCustomJoi()
      .stringArray()
      .items(
        Joi.string()
          .allow("")
          .valid(...Object.values(NotifContextType))
      )
      .optional(),
    unreadOnly: Joi.boolean().optional().default(false),
  })
  .required();
