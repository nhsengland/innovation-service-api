import { CustomContext } from "../../utils/types";

export const updateInnovationAction = async (
  ctx: CustomContext,
  actionId: string,
  accessorId: string,
  innovationId: string,
  action: any
) => {
  const result = await ctx.services.InnovationActionService.update(
    actionId,
    accessorId,
    innovationId,
    action,
    ctx.auth.userOrganisations
  );

  return result;
};
