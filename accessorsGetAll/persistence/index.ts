import { CustomContext } from "../../utils/types";
export const findUserOrganisationUnitUsers = async (ctx: CustomContext) => {
  const result = await ctx.services.OrganisationService.findUserOrganisationUnitUsers(
    ctx.auth.requestUser
  );
  return result;
};
