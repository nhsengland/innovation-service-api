import { CustomContext } from "../../utils/types";

export const findInnovationsByInnovator = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getInnovationOverview(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
