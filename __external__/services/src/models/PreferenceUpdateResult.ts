interface PreferenceUpdateError {
  code: string;
  message: string;
}

export interface PreferenceUpdateResult {
  id: string;
  status: "OK" | "ERROR";
  error?: PreferenceUpdateError;
}
