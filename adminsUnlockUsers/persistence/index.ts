import { CustomContext } from "../../utils/types";

export const unlockUser = async (ctx: CustomContext, user: string) => {
  const result = await ctx.services.AdminService.unlockUser(
    ctx.auth.requestUser,
    user
  );

  return result;
};
