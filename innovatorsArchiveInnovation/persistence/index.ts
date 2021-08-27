import { CustomContext } from "../../utils/types";

export const archiveInnovation = async (
  ctx: CustomContext,
  id: string,
  reason: string
) => {
  const result = await ctx.services.InnovationService.archiveInnovation(
    ctx.auth.requestUser,
    id,
    reason
  );

  return result;
};
