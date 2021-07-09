import { CustomContext } from "../../utils/types";

export const updateInnovationAction = async (
  ctx: CustomContext,
  actionId: string,
  innovationId: string,
  action: any
) => {
  const result = await ctx.services.InnovationActionService.updateByAccessor(
    ctx.auth.requestUser,
    actionId,
    innovationId,
    action
  );

  return result;
};
