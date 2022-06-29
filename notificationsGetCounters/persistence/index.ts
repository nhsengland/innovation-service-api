import { CustomContext } from "../../utils/types";

export const getNotificationsCountersByUserId = async (ctx: CustomContext) => {
  const result = await ctx.services.InAppNotificationService.getNotificationCountersByUserId(
    ctx.auth.requestUser
  );

  return result;
};
