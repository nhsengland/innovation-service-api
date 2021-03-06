export enum NotifContextType {
  INNOVATION = "INNOVATION",
  COMMENT = "COMMENT",
  ACTION = "ACTION",
  NEEDS_ASSESSMENT = "NEEDS_ASSESSMENT",
  SUPPORT = "SUPPORT",
}

export enum NotifContextDetail {
  LOCK_USER = "LOCK_USER",
  COMMENT_CREATION = "COMMENT_CREATION",
  COMMENT_REPLY = "COMMENT_REPLY",
  ACTION_CREATION = "ACTION_CREATION",
  ACTION_UPDATE = "ACTION_UPDATE",
  NEEDS_ASSESSMENT_COMPLETED = "NEEDS_ASSESSMENT_COMPLETED",
  NEEDS_ASSESSMENT_ORGANISATION_SUGGESTION = "NEEDS_ASSESSMENT_ORGANISATION_SUGGESTION",
  INNOVATION_SUBMISSION = "INNOVATION_SUBMISSION",
  SUPPORT_STATUS_UPDATE = "SUPPORT_STATUS_UPDATE",
}

export type NotifContextPayloadType = {
  id: string;
  type: NotifContextType;
};

export type NotificationParamsType = {};
