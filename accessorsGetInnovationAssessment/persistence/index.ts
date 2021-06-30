import { CustomContext } from "../../utils/types";

export const findInnovationAssessmentById = async (
  ctx: CustomContext,
  assessmentId: string,
  innovationId: string,
  accessorId: string
) => {
  const result = await ctx.services.InnovationAssessmentService.findByUser(
    assessmentId,
    accessorId,
    innovationId,
    ctx.auth.userOrganisations
  );

  return result;
};
