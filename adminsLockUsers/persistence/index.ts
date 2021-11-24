import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserUpdateModel } from "@services/models/UserUpdateModel";
import { CustomContext } from "../../utils/types";

export const lockUsers = async (ctx: CustomContext, users: string[]) => {
  const result = await ctx.services.UserService.lockUsers(
    ctx.auth.requestUser,
    users
  );

  return result;
};
