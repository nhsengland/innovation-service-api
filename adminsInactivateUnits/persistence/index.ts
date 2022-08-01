import { CustomContext } from "../../utils/types";

export const inactivateUnits = async (
  ctx: CustomContext,
  units: string[]
) => {
  const result = await ctx.services.AdminService.inactivateOrganisationUnits(
    ctx.auth.requestUser,
    units,
  );

  return result;
};
