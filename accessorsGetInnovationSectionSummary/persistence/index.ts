import { CustomContext } from "../../utils/types";

export const findAllInnovationSections = async (
  ctx: CustomContext,
  innovationId: string,
  accessorId: string
) => {
  const result = await ctx.services.InnovationSectionService.findAllInnovationSections(
    innovationId,
    accessorId,
    ctx.auth.userOrganisations
  );

  return result;
};
