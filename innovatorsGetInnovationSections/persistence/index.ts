import { CustomContext } from "../../utils/types";

export const findInnovationSectionByInnovator = async (
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

export const findAllInnovationSectionsByInnovator = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSectionService.findAllSections(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
