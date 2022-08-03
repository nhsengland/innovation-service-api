import { CustomContext } from "../../utils/types";

export const activateUnit = async (ctx: CustomContext, unitId: string) => {
  const result = await ctx.services.AdminService.activateOrganisationUnit(
    ctx.auth.requestUser,
    unitId
  );

  return result;
};
