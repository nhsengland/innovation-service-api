import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const createInnovationEvidence = async (
  ctx: CustomContext,
  evidence: any,
  section: InnovationSectionCatalogue
) => {
  const result = await ctx.services.InnovationEvidenceService.create(
    ctx.auth.requestUser,
    evidence,
    section
  );

  return result;
};
