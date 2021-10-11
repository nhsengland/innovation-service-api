import { NotificationContextType } from "@domain/index";

export interface PreferenceUpdateModel {
  notificationType: NotificationContextType;
  isSubscribed: boolean;
}
