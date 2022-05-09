import { CustomContext } from "../../utils/types";

export const getProfile = async (
  ctx: CustomContext,
  id: string,
  externalId: string
) => {
  return await ctx.services.UserService.getProfile(id, externalId);
};
