import { CustomContext } from "../../utils/types";

export const findInnovationActions = async (
  ctx: CustomContext,
  innovationId: string,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationActionService.findAllByInnovation(
    innovatorId,
    innovationId
  );

  return result;
};
