import { UserUpdateModel } from "@services/models/UserUpdateModel";
import { CustomContext } from "../../utils/types";

export const updateProfile = async (
  ctx: CustomContext,
  user: UserUpdateModel
) => {
  const result = await ctx.services.UserService.updateProfile(
    ctx.auth.requestUser,
    user
  );

  return result;
};
