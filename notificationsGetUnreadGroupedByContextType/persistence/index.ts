import { CustomContext } from "../../utils/types";

export const getAllUnreadNotificationsCounts = async (
  ctx: CustomContext,
  innovatonId?: string
) => {
  const result = await ctx.services.NotificationService.getAllUnreadNotificationsCounts(
    ctx.auth.requestUser,
    innovatonId
  );
  return result;
};
