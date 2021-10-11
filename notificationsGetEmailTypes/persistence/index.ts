import { CustomContext } from "../../utils/types";

export const getEmailNotificationPreferences = async (ctx: CustomContext) => {
  const result = await ctx.services.NotificationService.getEmailNotificationPreferences(
    ctx.auth.requestUser
  );
  return result;
};
