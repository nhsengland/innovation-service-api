import { CustomContext } from "../../utils/types";

export const changeRoleValidation = async (
  ctx: CustomContext,
  userId: string
) => {
  const result = await ctx.services.AdminService.userChangeRoleValidation(
    userId
  );

  return result;
};
