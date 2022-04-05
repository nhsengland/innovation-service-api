import { CustomContext } from "../../utils/types";

export const updateOrganisationUnit = async (
  ctx: CustomContext,
  organisationUnitId: string,
  name: string,
  acronym: string
) => {
  const result = await ctx.services.AdminService.updateOrganisationUnit(
    organisationUnitId,
    name,
    acronym
  );
  return result;
};
