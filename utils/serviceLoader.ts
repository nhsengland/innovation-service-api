import { initializeAllServices, Services } from "@services/index";
import { get, set } from "../utils/cache";

export const loadAllServices = async (): Promise<Services> => {
  let services: Services = get("nhsaac-services") as Services;

  if (!services) {
    services = await initializeAllServices();

    // 1 hour in cache
    set("nhsaac-services", services, 1 * 1000 * 3600);
  }

  return services;
};
