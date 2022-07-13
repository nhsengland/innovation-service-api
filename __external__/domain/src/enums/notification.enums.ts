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

export enum NotificationActionType {
  ACTION_CREATION = "ACTION_CREATION",
  ACTION_UPDATE = "ACTION_UPDATE",
  COMMENT_CREATION = "COMMENT_CREATION",
  COMMENT_REPLY = "COMMENT_REPLY",
  INNOVATOR_SUPPORT_STATUS_UPDATE = "INNOVATOR_SUPPORT_STATUS_UPDATE", //*
  ACCESSOR_SUPPORT_STATUS_UPDATE = "ACCESSOR_SUPPORT_STATUS_UPDATE", //*
  NA_SUPPORT_STATUS_UPDATE = "NA_SUPPORT_STATUS_UPDATE", //*
  LOCK_USER = "LOCK_USER",
  INNOVATION_USER_LOCK = "INNOVATION_USER_LOCK",
  INNOVATION_SUBMITED = "INNOVATION_SUBMITED", // tested
  INNOVATION_ARCHIVED = "INNOVATION_ARCHIVED",
  QA_NEEDS_ASSESSMENT_COMPLETED = "QA_NEEDS_ASSESSMENT_COMPLETED", // tested
  INNOVATOR_NEEDS_ASSESSMENT_COMPLETED = "INNOVATOR_NEEDS_ASSESSMENT_COMPLETED", // tested
  INNOVATOR_ORGANISATION_SUGGESTION = "INNOVATOR_ORGANISATION_SUGGESTION", // tested
  QA_INNOVATION_SUGGESTION = "QA_INNOVATION_SUGGESTION",
  ADMINS_LOGIN_VALIDATION = "ADMINS_LOGIN_VALIDATION",
  INNOVATOR_ACCOUNT_CREATION = "INNOVATOR_ACCOUNT_CREATION",
  ACCESSOR_UNIT_CHANGE = "ACCESSOR_UNIT_CHANGE",
  TRANSFER_OWNERSHIP_EXISTING_USER = "TRANSFER_OWNERSHIP_EXISTING_USER",
  TRANSFER_OWNERSHIP_NEW_USER = "TRANSFER_OWNERSHIP_NEW_USER",
  TRANSFER_OWNERSHIP_CONFIRMATION = "TRANSFER_OWNERSHIP_CONFIRMATION",
}

export type NotifContextPayloadType = {
  id: string;
  type: NotifContextType;
};

export type NotificationParamsType = {};
