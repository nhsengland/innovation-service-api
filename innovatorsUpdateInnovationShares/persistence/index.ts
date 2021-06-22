import { CustomContext } from "../../utils/types";

export const updateInnovationShares = async (
  ctx: CustomContext,
  innovationId: string,
  innovatorId: string,
  organisations: string[]
) => {
  const result = await ctx.services.InnovationService.updateOrganisationShares(
    innovationId,
    innovatorId,
    organisations
  );

  return result;
};
