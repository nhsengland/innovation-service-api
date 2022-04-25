import { CustomContext } from "../../utils/types";

export const updateUserOrganisationUnit = async (
  ctx: CustomContext,
  userId: string,
  newOrganisationUnitAcronym: string,
  organisationId: string
) => {
  const result = await ctx.services.UserService.updateUserOrganisationUnit(
    ctx.auth.requestUser,
    userId,
    newOrganisationUnitAcronym,
    organisationId
  );
  return result;
};
