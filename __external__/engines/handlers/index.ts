import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  Innovation,
  InnovationSupport,
  InnovationSupportStatus,
  NotificationContextType,
  NotificationPreference,
  NotificationPreferenceType,
  UserType,
} from "@domain/index";
import * as helpers from "@helpers/index";
import { UserService } from "@services/index";
import { EmailTemplateNotFound, InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import {
  EmailProps,
  EmailResponse,
  EmailService,
} from "@services/services/Email.service";
import { getRepository } from "typeorm";
import { getTemplates } from "../templates";

export const accessorsActionToReviewHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const innovationRepo = getRepository(Innovation, connectionName);

  const b2cUser = await helpers.getUserFromB2C(requestUser.externalId);
  const innovation = await innovationRepo.findOne(params.innovationId);

  const innovator_name = b2cUser.displayName;

  const innovation_name = innovation.name;
  const action_url = parseUrl(params, template);

  let recipients = targetUsers;
  recipients = recipients.filter((r) => r !== requestUser.externalId);

  const filteredRecipients = await filterRecipientsByPreference(
    NotificationContextType.ACTION,
    recipients
  );

  const props = {
    innovator_name,
    innovation_name,
    action_url,
  };

  const result = await emailService.sendMany(
    filteredRecipients,
    EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
    props
  );

  return result;
};

export const accessorsAssignedToInnovationHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const b2cUser = await helpers.getUserFromB2C(requestUser.externalId);
  const qa_name = b2cUser.displayName;
  const innovation_url = parseUrl(params, template);
  const props = {
    qa_name,
    innovation_url,
  };

  let recipients = targetUsers;
  recipients = recipients.filter((r) => r !== requestUser.externalId);

  const filteredRecipients = await filterRecipientsByPreference(
    NotificationContextType.SUPPORT,
    recipients
  );

  const result = await emailService.sendMany(
    filteredRecipients,
    EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
    props
  );

  return result;
};

export const innovatorActionRequested = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2cUser = await helpers.getUserFromB2C(requestUser.externalId);
  const innovation = await innovationRepo.findOne(params.innovationId, {
    relations: ["owner"],
  });

  const accessor_name = b2cUser.displayName;
  const unit_name = requestUser.organisationUnitUser.organisationUnit.name;
  const action_url = parseUrl(params, template);
  const props = {
    accessor_name,
    unit_name,
    action_url,
  };

  const recipients = [innovation.owner.externalId];

  const filteredRecipients = await filterRecipientsByPreference(
    NotificationContextType.ACTION,
    recipients
  );

  const result = await emailService.sendMany(
    filteredRecipients,
    EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST,
    props
  );

  return result;
};

export const qaOrganisationSuggestedForSupport = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const innovation_url = parseUrl(params, template);
  const props = {
    innovation_url,
  };

  let recipients = targetUsers;
  recipients = recipients.filter((r) => r !== requestUser.externalId);

  const result = await emailService.sendMany(
    recipients,
    EmailNotificationTemplate.QA_ORGANISATION_SUGGESTED,
    props
  );

  return result;
};

export const innovatorsTransferOwnershipNewUser = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const transfer_url = parseUrl(params, template);

  const props = {
    ...params.emailProps,
    transfer_url,
  };

  const recipient = targetUsers[0];

  const result = await emailService.sendOne(
    {
      email: recipient,
    },
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_NEW_USER,
    props
  );

  return result;
};

export const innovatorsTransferOwnershipExistingUser = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const transfer_url = parseUrl(params, template);

  const props = {
    ...params.emailProps,
    transfer_url,
  };

  const recipient = targetUsers[0];

  const result = await emailService.sendOne(
    {
      email: recipient,
    },
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER,
    props
  );

  return result;
};

export const innovatorsTransferOwnershipConfirmation = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const recipient = targetUsers[0];

  const result = await emailService.sendOne(
    {
      email: recipient,
    },
    template,
    params.emailProps
  );

  return result;
};

export const accessorsInnovationArchivalUpdate = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const recipients = targetUsers;

  const props = {
    ...params.emailProps,
  };

  const result = await emailService.sendMany(recipients, template, props);

  return result;
};

export const innovatorsAccountCreatedHandler = async (
  requestUser: RequestUser,
  params: {
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const result = await baseEmailExecutor(
    targetUsers,
    params,
    connectionName,
    template
  );

  return result;
};

export const innovatorsInnovationRecordSubmitedHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const result = await baseEmailExecutor(
    targetUsers,
    params,
    connectionName,
    template
  );

  return result;
};

export const innovatorsCommentReceivedHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const recipients = await filterRecipientsByPreference(
    NotificationContextType.COMMENT,
    targetUsers,
    connectionName
  );

  // exit early if there are no recipients after filtering out preferences.
  if (recipients.length === 0) return;
  //

  const comment_url = parseUrl(params, template);

  params.emailProps = {
    ...params.emailProps,
    comment_url,
  };

  const result = await baseEmailExecutor(
    recipients,
    params,
    connectionName,
    template
  );

  return result;
};

export const assessmentUsersInnovationRecordSubmitedHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  if (!targetUsers || targetUsers.length === 0) {
    const userService = new UserService(connectionName);
    const assessmentUsers = await userService.getUsersOfType(
      UserType.ASSESSMENT
    );

    targetUsers = assessmentUsers.map((a) => a.externalId);
  }

  const innovation_url = parseUrl(params, template);
  params.emailProps = {
    ...params.emailProps,
    innovation_url,
  };

  const result = await baseEmailExecutor(
    targetUsers,
    params,
    connectionName,
    template
  );

  return result;
};

export const innovatorsAssessmentCompleteHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const needs_assessment_url = parseUrl(params, template);
  params.emailProps = {
    ...params.emailProps,
    needs_assessment_url,
  };
  const result = await baseEmailExecutor(
    targetUsers,
    params,
    connectionName,
    template
  );

  return result;
};

const baseEmailExecutor = async (
  targetUsers,
  params,
  connectionName,
  template
) => {
  const recipients = targetUsers;

  const props = {
    ...params.emailProps,
  };

  const emailService = new EmailService(connectionName);

  const result = await emailService.sendMany(recipients, template, props);

  return result;
};

export const innovatorsSupportStatusUpdateHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const recipients = await filterRecipientsByPreference(
    NotificationContextType.SUPPORT,
    targetUsers,
    connectionName
  );

  // exit early if there are no recipients after filtering out preferences.
  if (recipients.length === 0) return;
  //
  const support_url = parseUrl(params, template);
  params.emailProps = {
    ...params.emailProps,
    support_url,
  };
  const result = await baseEmailExecutor(
    recipients,
    params,
    connectionName,
    template
  );

  return result;
};

export const accessorsCommentReceivedHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const recipients = await getRecipientsEngaging(
    params.innovationId,
    connectionName
  );

  let filteredRecipients = await filterRecipientsByPreference(
    NotificationContextType.COMMENT,
    recipients
  );

  // exit early if there are no recipients after filtering out preferences.
  if (filteredRecipients.length === 0) return;

  filteredRecipients = filteredRecipients.filter(
    (r) => r !== requestUser.externalId
  );

  const comment_url = parseUrl(params, template);

  params.emailProps = {
    ...params.emailProps,
    comment_url,
  };

  const result = await baseEmailExecutor(
    filteredRecipients,
    params,
    connectionName,
    template
  );

  return result;
};

export const userAccountLockedHandler = async (
  requestUser: RequestUser,
  params: {
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const recipient = targetUsers[0];

  if (recipient.length === 0) return;

  const props = {
    ...params.emailProps,
  };
  const result = await emailService.sendOne(
    {
      email: recipient,
    },
    EmailNotificationTemplate.USER_ACCOUNT_LOCKED,
    props
  );

  return result;
};

export const accessorsUnitChangeHandler = async (
  requestUser: RequestUser,
  params: {
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const recipient = targetUsers[0];

  if (recipient.length === 0) return;

  const props = {
    ...params.emailProps,
  };
  const result = await emailService.sendOne(
    {
      email: recipient,
    },
    EmailNotificationTemplate.ACCESSORS_UNIT_CHANGE,
    props
  );

  return result;
};

export const newQualifyingAccessorsUnitChangeHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const recipient = targetUsers[0];

  if (recipient.length === 0) return;

  params.emailProps = {
    ...params.emailProps,
  };

  const result = await baseEmailExecutor(
    recipient,
    params,
    connectionName,
    template
  );

  return result;
};

export const oldQualifyingAccessorsUnitChangeHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
    emailProps?: EmailProps;
  },
  template: EmailNotificationTemplate,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const recipient = targetUsers[0];

  params.emailProps = {
    ...params.emailProps,
  };

  const result = await baseEmailExecutor(
    recipient,
    params,
    connectionName,
    template
  );

  return result;
};

const parseUrl = (params, templateCode): string => {
  const baseUrl = process.env.CLIENT_WEB_BASE_URL;
  const template = getTemplates().find((t) => t.code === templateCode);
  if (!template)
    throw new EmailTemplateNotFound("Could not find email template");

  const path = template.path;
  let url = path.url;
  const parameters = Object.keys(path.params);

  for (const param of parameters) {
    if (!params[param])
      throw new InvalidParamsError(`Parameter ${param} is required.`);
    url = url.replace(`:${param}`, params[param]);
  }

  return `${baseUrl}/${url}`;
};

const getRecipientsEngaging = async (
  innovationId: string,
  connectionName?: string
) => {
  const innovationSupportRepo = getRepository(
    InnovationSupport,
    connectionName
  );
  const supports = await innovationSupportRepo.find({
    where: `innovation_id = '${innovationId}'
            and status in('${InnovationSupportStatus.ENGAGING}')`,
    relations: [
      "organisationUnitUsers",
      "organisationUnitUsers.organisationUser",
      "organisationUnitUsers.organisationUser.user",
    ],
  });

  const recipients = supports.flatMap((s) =>
    s.organisationUnitUsers.map((x) => x.organisationUser.user.externalId)
  );

  return recipients;
};

const getRecipients = async (innovationId: string, connectionName?: string) => {
  const innovationSupportRepo = getRepository(
    InnovationSupport,
    connectionName
  );
  const supports = await innovationSupportRepo.find({
    where: `innovation_id = '${innovationId}'
            and status in('${InnovationSupportStatus.ENGAGING}', '${InnovationSupportStatus.COMPLETE}')
           `,
    relations: [
      "organisationUnitUsers",
      "organisationUnitUsers.organisationUser",
      "organisationUnitUsers.organisationUser.user",
    ],
  });

  const recipients = supports.flatMap((s) =>
    s.organisationUnitUsers.map((x) => x.organisationUser.user.externalId)
  );

  return recipients;
};

const filterRecipientsByPreference = async (
  notificationType: string,
  recipients: string[],
  connectionName?: string
) => {
  const notificationPreferenceRepo = getRepository(
    NotificationPreference,
    connectionName
  );

  const filteredRecipients = [];

  for (let idx = 0; idx < recipients.length; idx++) {
    const recipient = recipients[idx];

    const userPreference = await notificationPreferenceRepo.findOne({
      where: `notification_id = '${notificationType}' and user_id = '${recipient}'`,
    });

    if (
      !userPreference ||
      userPreference?.preference === NotificationPreferenceType.INSTANTLY
    ) {
      filteredRecipients.push(recipient);
    }
  }

  return filteredRecipients;
};
