import { CustomContext } from "../../utils/types";

export const updateInnovationSupport = async (
  ctx: CustomContext,
  supportId: string,
  innovationId: string,
  support: any
) => {
  const result = await ctx.services.InnovationSupportService.update(
    ctx.auth.requestUser,
    supportId,
    innovationId,
    support
  );

  return result;
};
