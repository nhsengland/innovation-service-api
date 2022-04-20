import { CustomContext } from "../../utils/types";

export const deleteAdminAccount = async (
  ctx: CustomContext,
  userId: string
) => {
  const result = await ctx.services.AdminService.deleteAdminAccounts(
    ctx.auth.requestUser,
    userId
  );

  return result;
};
