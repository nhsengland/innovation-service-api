import { CustomContext } from "../../utils/types";

export const getNotificationsByInnovationId = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InAppNotificationService.getNotificationsByInnovationId(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
