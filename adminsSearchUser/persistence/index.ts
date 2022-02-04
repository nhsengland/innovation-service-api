import { CustomContext } from "../../utils/types";

export const searchUserByEmail = async (ctx: CustomContext, email: string) => {
  const result = await ctx.services.UserService.searchUser(email);
  return result;
};
