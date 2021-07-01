import { CustomContext } from "../../utils/types";

export const findInnovationSection = async (
  ctx: CustomContext,
  innovationId: string,
  section: string
) => {
  const result = await ctx.services.InnovationSectionService.findSection(
    ctx.auth.requestUser,
    innovationId,
    section
  );

  return result;
};
