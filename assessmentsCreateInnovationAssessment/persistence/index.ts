import { CustomContext } from "../../utils/types";

export const createInnovationAssessment = async (
  ctx: CustomContext,
  assessmentUserId: string,
  innovationId: string,
  assessment: any
) => {
  const result = await ctx.services.InnovationAssessmentService.create(
    assessmentUserId,
    innovationId,
    assessment
  );

  return result;
};
