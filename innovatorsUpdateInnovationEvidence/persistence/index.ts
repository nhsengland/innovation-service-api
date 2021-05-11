import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const updateInnovationEvidence = async (
  ctx: CustomContext,
  id: string,
  innovatorId: string,
  evidence: any,
  section: InnovationSectionCatalogue
) => {
  const result = await ctx.services.InnovationEvidenceService.update(
    id,
    innovatorId,
    evidence,
    section
  );

  return result;
};
