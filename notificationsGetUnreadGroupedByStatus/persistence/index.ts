import { CustomContext } from "../../utils/types";

export const getNotificationsGroupedByStatus = async (
  ctx: CustomContext,
  scope: string
) => {
  let result;

  switch (scope) {
    case "INNOVATION_STATUS":
      result = await ctx.services.NotificationService.getNotificationsGroupedByInnovationStatus(
        ctx.auth.requestUser
      );
      break;
    case "SUPPORT_STATUS":
      result = await ctx.services.NotificationService.getNotificationsGroupedBySupportStatus(
        ctx.auth.requestUser
      );
      break;
    default:
      break;
  }

  return result;
};
