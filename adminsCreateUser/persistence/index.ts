import { UserCreationModel } from "@services/models/UserCreationModel";
import { CustomContext } from "../../utils/types";

export const createUser = async (
  ctx: CustomContext,
  user: UserCreationModel
) => {
  const result = await ctx.services.AdminService.createUser(
    ctx.auth.requestUser,
    user
  );

  return result;
};
