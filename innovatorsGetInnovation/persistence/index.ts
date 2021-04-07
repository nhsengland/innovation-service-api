import { InnovationService } from "nhs-aac-domain-services";

export const findAllInnovationsByInnovator = async (
  innovatorId: string,
  innovationId: string
) => {
  const service = new InnovationService();
  const result = await service.getInnovationOverview(innovatorId, innovationId);

  return result;
};
