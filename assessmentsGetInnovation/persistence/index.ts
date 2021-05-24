import { CustomContext } from "../../utils/types";

export const findInnovationById = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationService.find(innovationId);

  return result;
};
