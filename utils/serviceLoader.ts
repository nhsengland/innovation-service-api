import { initializeAllServices, Services } from "nhs-aac-domain-services";

export const loadAllServices = async (): Promise<Services> => {
  return await initializeAllServices();
};
