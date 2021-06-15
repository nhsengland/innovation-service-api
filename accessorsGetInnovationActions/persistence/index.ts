import { CustomContext } from "../../utils/types";

export const findInnovationActions = async (
  ctx: CustomContext,
  innovationId: string,
  accessorId: string
) => {
  const result = await ctx.services.InnovationActionService.findAllByInnovation(
    accessorId,
    innovationId,
    ctx.auth.userOrganisations
  );

  return result;
};
