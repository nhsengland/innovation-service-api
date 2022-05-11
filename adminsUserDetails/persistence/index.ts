import { User, UserType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const getUser = async (
  ctx: CustomContext,
  userId: string,
  model: "MINIMAL" | "FULL"
) => {
  let dbUser: User;
  dbUser = await ctx.services.UserService.getUser(userId);

  if (!dbUser) {
    dbUser = await ctx.services.UserService.getUserByOptions({
      where: { externalId: userId },
    });
  }

  const result = await ctx.services.AdminService.getUserDetails(
    dbUser.externalId,
    model
  );
  return result;
};
