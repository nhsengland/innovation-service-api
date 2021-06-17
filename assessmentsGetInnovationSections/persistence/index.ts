import { CustomContext } from "../../utils/types";

export const findInnovationSection = async (
  ctx: CustomContext,
  innovationId: string,
  innovatorId: string,
  section: string
) => {
  const result = await ctx.services.InnovationSectionService.findSection(
    innovationId,
    innovatorId,
    section
  );

  return result;
};
