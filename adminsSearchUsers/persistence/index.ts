import { CustomContext } from "../../utils/types";

export const searchUsers = async (ctx: CustomContext, emails: string[]) => {
  const result = await ctx.services.UserService.searchUsersByEmail(
    ctx.auth.requestUser,
    emails
  );

  return result;
};
