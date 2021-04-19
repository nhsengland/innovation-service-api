import { CustomContext } from "../../utils/types";
export const findAllInnovationsByAccessor = async (
  ctx: CustomContext,
  accessorId: string,
  filter: any
) => {
  const result = await ctx.services.InnovationService.findAllByAccessor(
    accessorId,
    ctx.auth.userOrganisations,
    filter
  );
  return result;
};
