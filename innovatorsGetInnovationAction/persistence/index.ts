import { CustomContext } from "../../utils/types";

export const findInnovationAction = async (
  ctx: CustomContext,
  actionId: string,
  innovationId: string,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationActionService.find(
    actionId,
    innovatorId,
    innovationId
  );

  return result;
};
