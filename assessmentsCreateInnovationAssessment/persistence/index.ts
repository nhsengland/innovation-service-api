import { CustomContext } from "../../utils/types";

export const createInnovationAssessment = async (
  ctx: CustomContext,
  assessmentUserId: string,
  assessment: any
) => {
  const result = await ctx.services.InnovationAssessmentService.create(
    assessmentUserId,
    assessment
  );

  return result;
};
