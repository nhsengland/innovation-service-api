import { NotFound } from "utils/responsify";
import { CustomContext } from "../../utils/types";

export const lockUsers = async (ctx: CustomContext, user: string) => {
  const dbUser = await ctx.services.UserService.getUser(user);

  if (!dbUser) {
    throw NotFound("The user about to be locked was not found");
  }

  const result = await ctx.services.AdminService.lockUsers(
    ctx.auth.requestUser,
    dbUser.externalId
  );

  return result;
};
