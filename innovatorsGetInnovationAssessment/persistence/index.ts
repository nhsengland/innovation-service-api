import { CustomContext } from "../../utils/types";

export const findInnovationAssessmentById = async (
  ctx: CustomContext,
  assessmentId: string,
  innovationId: string,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationAssessmentService.findByUser(
    assessmentId,
    innovatorId,
    innovationId
  );

  return result;
};
