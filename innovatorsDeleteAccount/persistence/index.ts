import { CustomContext } from "../../utils/types";

export const deleteAccount = async (ctx: CustomContext, reason?: string) => {
  const result = await ctx.services.InnovatorService.delete(
    ctx.auth.requestUser,
    reason
  );

  return result;
};
