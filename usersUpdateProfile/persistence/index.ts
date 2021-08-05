import { UserProfileUpdateModel } from "@services/models/UserProfileUpdateModel";
import { CustomContext } from "../../utils/types";

export const updateProfile = async (
  ctx: CustomContext,
  user: UserProfileUpdateModel
) => {
  const result = await ctx.services.UserService.updateProfile(
    ctx.auth.requestUser,
    user
  );

  return result;
};
