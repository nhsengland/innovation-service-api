import { CustomContext } from "../../utils/types";

export const findInnovationSupport = async (
  ctx: CustomContext,
  supportId: string,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSupportService.find(
    ctx.auth.requestUser,
    supportId,
    innovationId
  );

  return result;
};
