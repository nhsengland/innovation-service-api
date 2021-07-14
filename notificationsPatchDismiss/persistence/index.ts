import { NotificationContextType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const patchDismissNotification = async (
  ctx: CustomContext,
  contextId: string,
  contextType: NotificationContextType
) => {
  const result = await ctx.services.NotificationService.dismiss(
    ctx.auth.requestUser,
    contextType,
    contextId
  );
  return result;
};
