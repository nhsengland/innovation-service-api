import { CustomContext } from "../../utils/types";

export const lockValidation = async (ctx: CustomContext, userId: string) => {
  const result = await ctx.services.AdminService.userLockValidation(userId);

  return result;
};
