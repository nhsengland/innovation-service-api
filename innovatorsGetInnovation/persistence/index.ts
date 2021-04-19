import { CustomContext } from "../../utils/types";

export const findInnovationsByInnovator = async (
  ctx: CustomContext,
  innovatorId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getInnovationOverview(
    innovationId,
    innovatorId
  );

  return result;
};
