import { UserType } from "@domain/index";
import { CustomContext } from "../../utils/types";

export const searchUsersByType = async (ctx: CustomContext, type: UserType) => {
  const result = await ctx.services.AdminService.getUsersOfType(type);
  return result;
};

export const searchUserByEmail = async (
  ctx: CustomContext,
  email: string,
  isAdmin: boolean
) => {
  const result = await ctx.services.AdminService.searchUser(email, isAdmin);

  return result;
};
