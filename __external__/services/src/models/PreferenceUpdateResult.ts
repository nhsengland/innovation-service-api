interface PreferenceUpdateError {
  code: string;
  message: string;
}

export interface PreferenceUpdateResult {
  notificationType: string;
  status: "OK" | "ERROR";
  error?: PreferenceUpdateError;
}
