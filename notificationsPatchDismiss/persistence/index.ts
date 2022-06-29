import {
  NotifContextType,
  NotifContextPayloadType,
} from "@domain/enums/notification.enums";
import { CustomContext } from "../../utils/types";

export const patchDismissNotification = async (
  ctx: CustomContext,
  notificationIds?: string[],
  notificationContext?: NotifContextPayloadType
) => {
  const result = await ctx.services.NotificationService.dismiss(
    ctx.auth.requestUser,
    notificationIds,
    notificationContext
  );
  return result;
};
