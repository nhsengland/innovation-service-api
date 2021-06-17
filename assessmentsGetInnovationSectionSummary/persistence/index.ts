import { CustomContext } from "../../utils/types";

export const findAllInnovationSectionsByAssessment = async (
  ctx: CustomContext,
  innovatorId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSectionService.findAllInnovationSectionsByAssessment(
    innovationId,
    innovatorId
  );

  return result;
};
