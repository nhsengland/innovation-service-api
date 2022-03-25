import { CustomContext } from "utils/types";

export const findOrganisation = async (
  context: CustomContext,
  organisationId: string
) => {
  const result = await context.services.OrganisationService.findOrganisationById(
    organisationId
  );

  return result;
};
