import { CustomContext } from "../../utils/types";

export const findInnovationAction = async (
  ctx: CustomContext,
  actionId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationActionService.find(
    ctx.auth.requestUser,
    actionId,
    innovationId
  );

  return result;
};
