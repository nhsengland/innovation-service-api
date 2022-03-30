import { CustomContext } from "../../utils/types";

export const updateOrganisationNameAcronym = async (
  ctx: CustomContext,
  organisationId: string,
  name: string,
  acronym: string
) => {
  const result = await ctx.services.AdminService.updateOrganisationNameAcronym(
    organisationId,
    name,
    acronym
  );
  return result;
};
