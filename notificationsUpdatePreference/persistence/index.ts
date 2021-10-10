import { NotificationContextType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const updateNotificationPreference = async (
  ctx: CustomContext,
  notificationId: string,
  isSubscribed: boolean
) => {
  const result = await ctx.services.NotificationService.updateNotificationPreference(
    ctx.auth.requestUser,
    notificationId as NotificationContextType,
    isSubscribed
  );

  return result;
};
