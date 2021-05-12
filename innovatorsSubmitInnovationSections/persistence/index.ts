import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const submitInnovationSections = async (
  ctx: CustomContext,
  id: string,
  innovatorId: string,
  sections: InnovationSectionCatalogue[]
) => {
  const result = await ctx.services.InnovationSectionService.submitSections(
    id,
    innovatorId,
    sections
  );

  return result;
};
