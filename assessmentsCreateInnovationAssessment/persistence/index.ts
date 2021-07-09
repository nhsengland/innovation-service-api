import { CustomContext } from "../../utils/types";

export const createInnovationAssessment = async (
  ctx: CustomContext,
  innovationId: string,
  assessment: any
) => {
  const result = await ctx.services.InnovationAssessmentService.create(
    ctx.auth.requestUser,
    innovationId,
    assessment
  );

  return result;
};
