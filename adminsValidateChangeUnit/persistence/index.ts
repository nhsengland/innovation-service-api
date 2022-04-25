import { CustomContext } from "../../utils/types";

export const changeUnitValidation = async (
  ctx: CustomContext,
  userId: string
) => {
  const result = await ctx.services.AdminService.userChangeUnitValidation(
    userId
  );

  return result;
};
