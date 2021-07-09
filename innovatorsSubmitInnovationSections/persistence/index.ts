import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const submitInnovationSections = async (
  ctx: CustomContext,
  id: string,
  sections: InnovationSectionCatalogue[]
) => {
  const result = await ctx.services.InnovationSectionService.submitSections(
    ctx.auth.requestUser,
    id,
    sections
  );

  return result;
};
