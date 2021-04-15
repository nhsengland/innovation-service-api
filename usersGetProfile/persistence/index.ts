import { ADUserService } from "nhs-aac-domain-services";

export const getProfile = async (id: string) => {
  const userService = new ADUserService();
  return await userService.getProfile(id);
};
