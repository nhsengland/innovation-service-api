import { InnovationService } from "nhs-aac-domain-services";

export const findAllInnovationsByInnovator = async (innovatorId: string) => {
  const service = new InnovationService();
  const result = await service.findAllByInnovator(innovatorId);

  return result;
};
