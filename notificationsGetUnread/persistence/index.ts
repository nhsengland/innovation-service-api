import { CustomContext } from "../../utils/types";

export const getUnreadNotificationsCounts = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.NotificationService.getUnreadNotificationsCounts(
    ctx.auth.requestUser,
    innovationId
  );
  return result;
};
