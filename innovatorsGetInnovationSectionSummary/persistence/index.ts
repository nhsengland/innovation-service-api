import { CustomContext } from "../../utils/types";

export const findAllInnovationSectionsByInnovator = async (
  ctx: CustomContext,
  innovatorId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSectionService.findAllInnovationSectionsByInnovator(
    innovationId,
    innovatorId
  );

  return result;
};
