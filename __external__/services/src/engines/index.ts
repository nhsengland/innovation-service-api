import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import * as handlers from "./handlers";
export const emailEngines = [
  {
    key: EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
    handler: handlers.accessorsActionToReviewHandler,
  },
  {
    key: EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
    handler: handlers.accessorsAssignedToInnovationHandler,
  },
];
