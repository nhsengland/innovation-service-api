import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import { RequestUser } from "@services/models/RequestUser";
import { EmailResponse } from "@services/services/Email.service";
import * as handlers from "./handlers";

type HandlerFunc = (
  requestUser: RequestUser,
  params: { [key: string]: any },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
) => Promise<EmailResponse[]>;

export const emailEngines = (): { key: string; handler: HandlerFunc }[] => [
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
  {
    key: EmailNotificationTemplate.INNOVATORS_ACCOUNT_CREATED,
    handler: handlers.innovatorsAccountCreatedHandler,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_NEEDS_ASSESSMENT_SUBMITED,
    handler: handlers.innovatorsInnovationRecordSubmitedHandler,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_COMMENT_RECEIVED,
    handler: handlers.innovatorsCommentReceivedHandler,
  },
  {
    key: EmailNotificationTemplate.ASSESSMENT_USERS_INNOVATION_SUBMITED,
    handler: handlers.assessmentUsersInnovationRecordSubmitedHandler,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_NEEDS_ASSESSMENT_COMPLETED,
    handler: handlers.innovatorsAssessmentCompleteHandler,
  },
  {
    key: EmailNotificationTemplate.INNOVATORS_SUPPORT_STATUS_UPDATE,
    handler: handlers.innovatorsSupportStatusUpdateHandler,
  },
  {
    key: EmailNotificationTemplate.ACCESSORS_COMMENT_RECEIVED,
    handler: handlers.accessorsCommentReceivedHandler,
  },
  {
    key: EmailNotificationTemplate.USER_ACCOUNT_LOCKED,
    handler: handlers.userAccountLockedHandler,
  },
];
