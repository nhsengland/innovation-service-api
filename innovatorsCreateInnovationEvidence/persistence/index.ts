import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const createInnovationEvidence = async (
  ctx: CustomContext,
  innovatorId: string,
  evidence: any,
  section: InnovationSectionCatalogue
) => {
  const result = await ctx.services.InnovationEvidenceService.create(
    innovatorId,
    evidence,
    section
  );

  return result;
};
