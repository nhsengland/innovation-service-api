import { CustomContext } from "utils/types";

export const findOrganisationUnitUsers = async (
  context: CustomContext,
  organisationUnitId: string
) => {
  const result = await context.services.OrganisationService.findOrganisationUnitUsers(
    organisationUnitId
  );

  return result;
};
