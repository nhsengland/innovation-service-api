import { CustomContext } from "../../utils/types";

export const findInnovationAssessmentById = async (
  ctx: CustomContext,
  assessmentId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationAssessmentService.find(
    ctx.auth.requestUser,
    assessmentId,
    innovationId
  );

  return result;
};
