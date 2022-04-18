import { CustomContext } from "../../utils/types";

export const deleteAdminAccount = async (
  ctx: CustomContext,
  userId: string,
  userEmail: string
) => {
  const result = await ctx.services.AdminService.deleteAdminAccounts(
    ctx.auth.requestUser,
    userId,
    userEmail
  );

  return result;
};
