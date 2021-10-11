import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import * as handlers from "./handlers";
export const emailEngines = (): any[] => [
  {
    key: EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
    handler: handlers.accessorsActionToReviewHandler,
  },
  {
    key: EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
    handler: handlers.accessorsAssignedToInnovationHandler,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST,
    handler: handlers.innovatorActionRequested,
  },
  {
    key: EmailNotificationTemplate.QA_ORGANISATION_SUGGESTED,
    handler: handlers.qaOrganisationSuggestedForSupport,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_NEW_USER,
    handler: handlers.innovatorsTransferOwnershipNewUser,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER,
    handler: handlers.innovatorsTransferOwnershipExistingUser,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_CONFIRMATION,
    handler: handlers.innovatorsTransferOwnershipConfirmation,
  },
  {
    key: EmailNotificationTemplate.ACCESSORS_INNOVATION_ARCHIVAL_UPDATE,
    handler: handlers.accessorsInnovationArchivalUpdate,
  },
];
