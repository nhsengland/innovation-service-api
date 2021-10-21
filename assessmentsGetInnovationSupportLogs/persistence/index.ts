import { CustomContext } from "../../utils/types";

export const findAllInnovationSupportLogs = async (
  ctx: CustomContext,
  innovationId: string
) => {
  const result = await ctx.services.InnovationSupportLogService.findAllByInnovation(
    ctx.auth.requestUser,
    innovationId
  );

  return result;
};
