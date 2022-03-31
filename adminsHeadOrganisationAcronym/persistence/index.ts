import { CustomContext } from "../../utils/types";

export const searchOrganisationByAcronym = async (
  ctx: CustomContext,
  acronym: string,
  organisationId: string
) => {
  const result = await ctx.services.AdminService.acronymExistsForOrganisationUpdate(
    acronym,
    organisationId
  );
  return result;
};
