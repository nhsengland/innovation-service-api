import { CustomContext } from "../../utils/types";

export const findInnovationAction = async (
  ctx: CustomContext,
  actionId: string,
  innovationId: string,
  accessorId: string
) => {
  const result = await ctx.services.InnovationActionService.find(
    actionId,
    accessorId,
    innovationId,
    ctx.auth.userOrganisations
  );

  return result;
};
