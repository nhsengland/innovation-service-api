import { CustomContext } from "../../utils/types";

export const getEmailNotificationTypes = async (ctx: CustomContext) => {
  const result = await ctx.services.NotificationService.getEmailNotificationTypes(
    ctx.auth.requestUser
  );
  return result;
};
