import { PreferenceUpdateModel } from "@services/models/PreferenceUpdateModel";
import { CustomContext } from "../../utils/types";

export const updateEmailNotificationPreferences = async (
  ctx: CustomContext,
  preferences: PreferenceUpdateModel[]
) => {
  const result = await ctx.services.NotificationService.updateEmailNotificationPreferences(
    ctx.auth.requestUser,
    preferences
  );

  return result;
};
