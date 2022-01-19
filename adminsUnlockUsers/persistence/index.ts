import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserUpdateModel } from "@services/models/UserUpdateModel";
import { CustomContext } from "../../utils/types";

export const unlockUsers = async (ctx: CustomContext, users: string[]) => {
  const result = await ctx.services.AdminService.unlockUsers(
    ctx.auth.requestUser,
    users
  );

  return result;
};
