import { CustomContext } from "../../utils/types";

export const updateInnovationAssessment = async (
  ctx: CustomContext,
  id: string,
  innovationId: string,
  assessment: any
) => {
  const result = await ctx.services.InnovationAssessmentService.update(
    ctx.auth.requestUser,
    id,
    innovationId,
    assessment
  );

  return result;
};
