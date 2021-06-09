import { CustomContext } from "../../utils/types";

export const findInnovationSupport = async (
  ctx: CustomContext,
  supportId: string,
  accessorId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSupportService.find(
    supportId,
    accessorId,
    innovationId,
    ctx.auth.userOrganisations
  );

  return result;
};
