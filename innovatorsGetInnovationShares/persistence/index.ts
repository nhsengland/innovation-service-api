import { CustomContext } from "../../utils/types";

export const findInnovationShares = async (
  ctx: CustomContext,
  innovationId: string,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationService.getOrganisationShares(
    innovationId,
    innovatorId
  );

  return result;
};
