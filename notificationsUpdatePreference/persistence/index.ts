import { PreferenceUpdateModel } from "@services/models/PreferenceUpdateModel";
import { CustomContext } from "../../utils/types";

export const updateNotificationPreference = async (
  ctx: CustomContext,
  preferences: PreferenceUpdateModel[]
) => {
  const result = await ctx.services.NotificationService.updateNotificationPreference(
    ctx.auth.requestUser,
    preferences
  );

  return result;
};
