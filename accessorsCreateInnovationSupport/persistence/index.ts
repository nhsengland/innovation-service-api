import { CustomContext } from "../../utils/types";

export const createInnovationSupport = async (
  ctx: CustomContext,
  accessorId: string,
  innovationId: string,
  support: any
) => {
  const result = await ctx.services.InnovationSupportService.create(
    accessorId,
    innovationId,
    support,
    ctx.auth.userOrganisations
  );

  return result;
};
