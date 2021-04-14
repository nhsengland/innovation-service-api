import { OrganisationService } from "nhs-aac-domain-services";

export const findAll = async (filter: any) => {
  const service = new OrganisationService();
  const result = await service.findAll(filter);

  return result;
};
