import { InnovationService } from "nhs-aac-domain-services";

export const findInnovationsByInnovator = async (
  innovatorId: string,
  innovationId: string
) => {
  const service = new InnovationService();
  const result = await service.getInnovationOverview(innovationId, innovatorId);

  return result;
};
