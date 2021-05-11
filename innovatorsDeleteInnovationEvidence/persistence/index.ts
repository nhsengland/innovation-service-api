import { CustomContext } from "../../utils/types";

export const deleteInnovationEvidence = async (
  ctx: CustomContext,
  id: string,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationEvidenceService.delete(
    id,
    innovatorId
  );

  return result;
};
