import { CustomContext } from "../../utils/types";

export const findInnovationSectionByAccessor = async (
  ctx: CustomContext,
  innovationId: string,
  accessorId: string,
  section: string
) => {
  const result = await ctx.services.InnovationSectionService.findSection(
    innovationId,
    accessorId,
    section,
    ctx.auth.userOrganisations
  );

  return result;
};
