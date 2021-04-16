import { InnovationService } from "nhs-aac-domain-services";

export const findAllInnovationsByAccessor = async (
  accessorId: string,
  filter: any
) => {
  const service = new InnovationService();
  const result = await service.findAllByAccessor(accessorId, filter);

  return result;
};
