import { CustomContext } from "../../utils/types";
export const findUserOrganisationUnitUsers = async (
  ctx: CustomContext,
  accessorId: string
) => {
  const result = await ctx.services.OrganisationService.findUserOrganisationUnitUsers(
    accessorId,
    ctx.auth.userOrganisations
  );
  return result;
};
