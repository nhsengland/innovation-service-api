import { CustomContext } from "../../utils/types";

export const getProfile = async (ctx: CustomContext, id: string) => {
  return await ctx.services.ADUserService.getProfile(id);
};
