import { CustomContext } from "../../utils/types";

export const findInnovationActions = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationActionService.findAllByInnovation(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
