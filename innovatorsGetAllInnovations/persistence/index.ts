import { CustomContext } from "../../utils/types";
export const findAllInnovationsByInnovator = async (
  ctx: CustomContext,
  innovatorId: string
) => {
  const result = await ctx.services.InnovationService.findAllByInnovator(
    innovatorId
  );
  return result;
};
