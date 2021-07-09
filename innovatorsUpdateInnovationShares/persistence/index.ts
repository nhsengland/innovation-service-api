import { CustomContext } from "../../utils/types";

export const updateInnovationShares = async (
  ctx: CustomContext,
  innovationId: string,
  organisations: string[]
) => {
  const result = await ctx.services.InnovationService.updateOrganisationShares(
    ctx.auth.requestUser,
    innovationId,
    organisations
  );

  return result;
};
