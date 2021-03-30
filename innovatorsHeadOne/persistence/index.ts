import { InnovatorService } from "nhs-aac-domain-services";

export const findInnovatorByOid = async (oid: string) => {
  const service = new InnovatorService();
  const result = await service.findByOid(oid);

  return result;
};
