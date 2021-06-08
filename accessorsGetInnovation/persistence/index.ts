import { CustomContext } from "../../utils/types";

export const findInnovationOverview = async (
  ctx: CustomContext,
  accessorId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getInnovationOverview(
    innovationId,
    accessorId,
    ctx.auth.userOrganisations
  );

  return result;
};
