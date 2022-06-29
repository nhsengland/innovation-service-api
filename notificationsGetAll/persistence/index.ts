import { PaginationQueryParamsType } from "utils/joi.helper";
import { CustomContext } from "../../utils/types";

export const getNotificationsByUserId = async (
  ctx: CustomContext,
  filters: { [key: string]: any },
  pagination: PaginationQueryParamsType<string>
) => {
  const result = await ctx.services.InAppNotificationService.getNotificationsByUserId(
    ctx.auth.requestUser,
    { contextTypes: filters.contextTypes, unreadOnly: filters.unreadOnly },
    pagination
  );

  return result;
};
