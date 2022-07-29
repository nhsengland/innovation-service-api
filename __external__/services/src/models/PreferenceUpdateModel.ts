import {
  NotificationContextType,
  NotificationPreferenceType,
} from "@domain/index";

export interface PreferenceUpdateModel {
  notificationType: NotificationContextType;
  preference: NotificationPreferenceType;
}
