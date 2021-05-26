import { InnovationSectionCatalogue } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const submitInnovation = async (
  ctx: CustomContext,
  id: string,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationService.submitInnovation(
    id,
    innovatorId
  );

  return result;
};
