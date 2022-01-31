import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserUpdateModel } from "@services/models/UserUpdateModel";
import { CustomContext } from "../../utils/types";

export const lockUsers = async (ctx: CustomContext, user: string) => {
  const result = await ctx.services.AdminService.lockUsers(
    ctx.auth.requestUser,
    user
  );

  return result;
};
