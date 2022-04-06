export interface OrganisationUpdateResult {
  id: string;
  status: "OK" | "ERROR";
  error?: string;
}
