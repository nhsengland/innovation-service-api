import { CustomContext } from "utils/types";

export const findOrganisation = async (
  context: CustomContext,
  organisationId: string
) => {
  const result = await context.services.OrganisationService.findOrganisationById(
    context.auth.requestUser,
    organisationId
  );

  return result;
};
