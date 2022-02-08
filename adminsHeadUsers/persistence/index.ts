import { CustomContext } from "../../utils/types";

export const searchUserByEmail = async (ctx: CustomContext, email: string) => {
  const result = await ctx.services.AdminService.userExistsB2C(email);
  return result;
};
