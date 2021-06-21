import { CustomContext } from "../../utils/types";

export const updateInnovationAction = async (
  ctx: CustomContext,
  actionId: string,
  innovatorId: string,
  innovationId: string,
  action: any
) => {
  const result = await ctx.services.InnovationActionService.updateByInnovator(
    actionId,
    innovatorId,
    innovationId,
    action
  );

  return result;
};
