import { CustomContext } from "../../utils/types";

export const getAssessmentInnovationSummary = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getAssessmentInnovationSummary(
    innovationId
  );

  return result;
};
