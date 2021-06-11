import { CustomContext } from "../../utils/types";

export const updateInnovationSupport = async (
  ctx: CustomContext,
  supportId: string,
  accessorId: string,
  innovationId: string,
  support: any
) => {
  const result = await ctx.services.InnovationSupportService.update(
    supportId,
    accessorId,
    innovationId,
    support,
    ctx.auth.userOrganisations
  );

  return result;
};
