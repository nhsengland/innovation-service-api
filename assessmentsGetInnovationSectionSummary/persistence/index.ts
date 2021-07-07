import { CustomContext } from "../../utils/types";

export const findAllInnovationSectionsByAssessment = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result =
    await ctx.services.InnovationSectionService.findAllInnovationSectionsByAssessment(
      ctx.auth.requestUser,
      innovationId
    );

  return result;
};
