import { UserType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const getUser = async (
  ctx: CustomContext,
  userId: string,
  model: "MINIMAL" | "FULL"
) => {
  const dbUser = await ctx.services.UserService.getUser(userId);

  const result = await ctx.services.AdminService.getUserDetails(
    dbUser.externalId,
    model
  );
  return result;
};
