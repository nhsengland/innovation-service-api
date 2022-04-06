import { CustomContext } from "../../utils/types";

export const updateOrganisation = async (
  ctx: CustomContext,
  organisationId: string,
  name: string,
  acronym: string
) => {
  const result = await ctx.services.OrganisationService.updateOrganisation(
    organisationId,
    name,
    acronym
  );
  return result;
};
