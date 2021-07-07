import { CustomContext } from "../../utils/types";

export const findInnovationOverview = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getAccessorInnovationSummary(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
