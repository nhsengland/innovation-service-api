import { CustomContext } from "../../utils/types";

export const createInnovationSupport = async (
  ctx: CustomContext,
  innovationId: string,
  support: any
) => {
  const result = await ctx.services.InnovationSupportService.create(
    ctx.auth.requestUser,
    innovationId,
    support
  );

  return result;
};
