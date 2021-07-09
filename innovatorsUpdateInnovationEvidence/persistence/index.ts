import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const updateInnovationEvidence = async (
  ctx: CustomContext,
  id: string,
  evidence: any,
  section: InnovationSectionCatalogue
) => {
  const result = await ctx.services.InnovationEvidenceService.update(
    ctx.auth.requestUser,
    id,
    evidence,
    section
  );

  return result;
};

export const getEvidenceWithOwner = async (ctx: CustomContext, id: string) => {
  const result = await ctx.services.InnovationEvidenceService.find(id);
  return result;
};
