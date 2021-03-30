import { Innovation, Innovator, Organisation } from "nhs-aac-domain";
import { ADUserService, InnovatorService } from "nhs-aac-domain-services";

export const createInnovator = async (
  innovator: Innovator,
  innovation: Innovation,
  organisation: Organisation
) => {
  const service = new InnovatorService();
  const result = await service.createFirstTimeSignIn(
    innovator,
    innovation,
    organisation
  );

  return result;
};

export const updateUserDisplayName = async (data: any) => {
  const userService = new ADUserService();

  try {
    await userService.updateUserDisplayName({ ...data.user }, data.oid);
  } catch (error) {
    throw error;
  }
};
