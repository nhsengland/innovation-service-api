import { CustomContext } from "../../utils/types";

export const updateInnovationAssessment = async (
  ctx: CustomContext,
  id: string,
  assessmentUserId: string,
  innovationId: string,
  assessment: any
) => {
  const result = await ctx.services.InnovationAssessmentService.update(
    id,
    assessmentUserId,
    innovationId,
    assessment
  );

  return result;
};
