import { NotifContextPayloadType } from "@domain/enums/notification.enums";
import { CustomContext } from "../../utils/types";

export const patchDismissNotification = async (
  ctx: CustomContext,
  dismissAll: boolean,
  notificationIds?: string[],
  notificationContext?: NotifContextPayloadType
) => {
  const result = await ctx.services.InAppNotificationService.dismiss(
    ctx.auth.requestUser,
    dismissAll,
    notificationIds,
    notificationContext
  );
  return result;
};
