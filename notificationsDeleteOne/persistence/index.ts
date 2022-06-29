import { CustomContext } from "../../utils/types";

export const deleteNotification = async (
  ctx: CustomContext,
  notificationId: string
) => {
  const result = await ctx.services.NotificationService.deleteNotification(
    ctx.auth.requestUser,
    notificationId
  );

  return result;
};
