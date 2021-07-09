import { CustomContext } from "../../utils/types";

export const findInnovationEvidenceById = async (
  ctx: CustomContext,
  evidenceId: string
) => {
  const result = await ctx.services.InnovationEvidenceService.find(evidenceId);

  return result;
};
