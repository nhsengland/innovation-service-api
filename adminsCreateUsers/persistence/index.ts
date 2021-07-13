import { UserCreationModel } from "@services/models/UserCreationModel";
import { CustomContext } from "../../utils/types";

export const createUsers = async (
  ctx: CustomContext,
  users: UserCreationModel[]
) => {
  const result = await ctx.services.UserService.createUsers(
    ctx.auth.requestUser,
    users
  );

  return result;
};
