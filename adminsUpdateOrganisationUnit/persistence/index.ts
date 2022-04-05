import { CustomContext } from "../../utils/types";

export const updateOrganisationUnit = async (
  ctx: CustomContext,
  organisationUnitId: string,
  name: string,
  acronym: string
) => {
  const result = await ctx.services.OrganisationService.updateOrganisationUnit(
    organisationUnitId,
    name,
    acronym
  );
  return result;
};
