import { CustomContext } from "../../utils/types";

export const getAssessmentInnovationSummary = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.getAssessmentInnovationSummary(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
