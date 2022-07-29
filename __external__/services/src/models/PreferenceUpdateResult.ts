import { NotificationContextType } from "@domain/index";

interface PreferenceUpdateError {
  code: string;
  message: string;
}

export interface PreferenceUpdateResult {
  notificationType: NotificationContextType;
  status: "OK" | "ERROR";
  error?: PreferenceUpdateError;
}
