interface OrganisationUpdateError {
  code: string;
  message: string;
}

export interface OrganisationUpdateResult {
  id: string;
  status: "OK" | "ERROR";
  error?: OrganisationUpdateError;
}
