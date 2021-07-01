import { CustomContext } from "../../utils/types";

export const findInnovationEvidenceById = async (
  ctx: CustomContext,
  evidenceId: string
) => {
  const result = await ctx.services.InnovationEvidenceService.find(evidenceId);

  return result;
};

export const findInnovationByAccessorId = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.findInnovation(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
