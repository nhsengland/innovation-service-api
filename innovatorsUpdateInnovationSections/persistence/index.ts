import { CustomContext } from "../../utils/types";

export const updateInnovationSection = async (
  ctx: CustomContext,
  innovationId: string,
  section: string,
  data: any
) => {
  const result = await ctx.services.InnovationSectionService.saveSection(
    ctx.auth.requestUser,
    innovationId,
    section,
    data
  );

  return result;
};
