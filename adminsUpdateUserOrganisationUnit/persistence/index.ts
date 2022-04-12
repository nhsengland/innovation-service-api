import { CustomContext } from "../../utils/types";

export const updateUserOrganisationUnit = async (
  ctx: CustomContext,
  userId: string,
  newOrganisationUnitId: string
) => {
  const result = await ctx.services.UserService.updateUserOrganisationUnit(
    userId,
    newOrganisationUnitId
  );
  return result;
};
