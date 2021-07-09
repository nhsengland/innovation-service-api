import { CustomContext } from "../../utils/types";

export const createInnovationAction = async (
  ctx: CustomContext,
  innovationId: string,
  action: any
) => {
  const result = await ctx.services.InnovationActionService.create(
    ctx.auth.requestUser,
    innovationId,
    action
  );

  return result;
};
