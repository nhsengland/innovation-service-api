import { CustomContext } from "../../utils/types";

export const findInnovationShares = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getOrganisationShares(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
