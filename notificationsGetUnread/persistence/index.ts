import { CustomContext } from "../../utils/types";

export const getUnreadNotificationsCounts = async (ctx: CustomContext) => {
  const result = await ctx.services.NotificationService.getAllUnreadNotificationsCounts(
    ctx.auth.requestUser
  );
  return result;
};
