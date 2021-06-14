import { CustomContext } from "../../utils/types";

export const createInnovationAction = async (
  ctx: CustomContext,
  accessorId: string,
  innovationId: string,
  action: any
) => {
  const result = await ctx.services.InnovationActionService.create(
    accessorId,
    innovationId,
    action,
    ctx.auth.userOrganisations
  );

  return result;
};
