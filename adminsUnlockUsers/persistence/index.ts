import { NotFound } from "utils/responsify";
import { CustomContext } from "../../utils/types";

export const unlockUser = async (ctx: CustomContext, userId: string) => {
  const dbUser = await ctx.services.UserService.getUser(userId);

  if (!dbUser) {
    throw NotFound("The user about to be locked was not found");
  }

  const result = await ctx.services.AdminService.unlockUser(
    ctx.auth.requestUser,
    userId,
    dbUser.externalId
  );

  return result;
};
