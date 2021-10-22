import { CustomContext } from "../../utils/types";

export const findAllInnovationSupports = async (
  ctx: CustomContext,
  innovationId: string,
  full?: boolean
) => {
  const result = await ctx.services.InnovationSupportService.findAllByInnovation(
    ctx.auth.requestUser,
    innovationId,
    full
  );

  return result;
};
