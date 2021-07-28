import { CustomContext } from "../../utils/types";

export const createInnovationSupportLog = async (
  ctx: CustomContext,
  innovationId: string,
  supportLog: any
) => {
  const result = await ctx.services.InnovationSupportLogService.create(
    ctx.auth.requestUser,
    innovationId,
    supportLog
  );

  return result;
};
