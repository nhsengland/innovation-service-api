import { UserCreationModel } from "@services/models/UserCreationModel";
import { UserUpdateModel } from "@services/models/UserUpdateModel";
import { CustomContext } from "../../utils/types";

export const updateUsers = async (
  ctx: CustomContext,
  users: UserUpdateModel[]
) => {
  const result = await ctx.services.UserService.updateUsers(
    ctx.auth.requestUser,
    users
  );

  return result;
};
