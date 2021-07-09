import { CustomContext } from "../../utils/types";

export const deleteInnovationEvidence = async (
  ctx: CustomContext,
  id: string
) => {
  const result = await ctx.services.InnovationEvidenceService.delete(
    ctx.auth.requestUser,
    id
  );

  return result;
};
