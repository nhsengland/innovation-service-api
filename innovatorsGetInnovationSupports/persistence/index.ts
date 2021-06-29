import { CustomContext } from "../../utils/types";

export const findAllInnovationSupports = async (
  ctx: CustomContext,
  userId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSupportService.findAllByInnovation(
    userId,
    innovationId
  );

  return result;
};
