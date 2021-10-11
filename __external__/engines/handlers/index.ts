import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  Innovation,
  InnovationSupport,
  InnovationSupportStatus,
  NotificationContextType,
  NotificationPreference,
} from "@domain/index";
import * as helpers from "@helpers/index";
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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const innovationRepo = getRepository(Innovation, connectionName);

  const b2cUser = await helpers.getUserFromB2C(requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId);

  const innovator_name = b2cUser.displayName;

  const innovation_name = innovation.name;
  const action_url = parseUrl(
    params,
    EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW
  );

  let recipients = await getRecipients(params.innovationId, connectionName);

  const props = {
    innovator_name,
    innovation_name,
    action_url,
  };

  recipients = recipients.filter(async (r) => {
    (await getUserPreference(NotificationContextType.ACTION, r)) === true;
  });

  const result = await emailService.sendMany(
    recipients,
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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const b2cUser = await helpers.getUserFromB2C(requestUser.id);
  const qa_name = b2cUser.displayName;
  const innovation_url = parseUrl(
    params,
    EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION
  );
  const props = {
    qa_name,
    innovation_url,
  };

  let recipients = targetUsers;
  recipients = recipients.filter((r) => r !== requestUser.id);

  recipients = recipients.filter(async (r) => {
    (await getUserPreference(NotificationContextType.SUPPORT, r)) === true;
  });

  const result = await emailService.sendMany(
    recipients,
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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2cUser = await helpers.getUserFromB2C(requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId, {
    relations: ["owner"],
  });

  const accessor_name = b2cUser.displayName;
  const unit_name = requestUser.organisationUnitUser.organisationUnit.name;
  const action_url = parseUrl(
    params,
    EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST
  );
  const props = {
    accessor_name,
    unit_name,
    action_url,
  };

  const recipients = [innovation.owner.id];

  const result = await emailService.sendMany(
    recipients,
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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const innovation_url = parseUrl(
    params,
    EmailNotificationTemplate.QA_ORGANISATION_SUGGESTED
  );
  const props = {
    innovation_url,
  };

  let recipients = targetUsers;
  recipients = recipients.filter((r) => r !== requestUser.id);

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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const transfer_url = parseUrl(
    params,
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_NEW_USER
  );

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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const transfer_url = parseUrl(
    params,
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER
  );

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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const recipient = targetUsers[0];

  const result = await emailService.sendOne(
    {
      email: recipient,
    },
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_CONFIRMATION,
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
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const recipients = targetUsers;

  const props = {
    ...params.emailProps,
  };

  const result = await emailService.sendMany(
    recipients,
    EmailNotificationTemplate.ACCESSORS_INNOVATION_ARCHIVAL_UPDATE,
    props
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

const getRecipients = async (innovationId: string, connectionName?: string) => {
  const innovationSupportRepo = getRepository(
    InnovationSupport,
    connectionName
  );
  const supports = await innovationSupportRepo.find({
    where: `innovation_id = '${innovationId}' and status in('${InnovationSupportStatus.ENGAGING}', '${InnovationSupportStatus.COMPLETE}')`,
    relations: [
      "organisationUnitUsers",
      "organisationUnitUsers.organisationUser",
      "organisationUnitUsers.organisationUser.user",
    ],
  });

  const recipients = supports.flatMap((s) =>
    s.organisationUnitUsers.map((x) => x.organisationUser.user.id)
  );

  return recipients;
};

const getUserPreference = async (
  notificationType: string,
  userId: string,
  connectionName?: string
): Promise<boolean> => {
  const notificationPreferenceRepo = getRepository(
    NotificationPreference,
    connectionName
  );
  const userPreference = await notificationPreferenceRepo.findOne({
    where: `notification_id = '${notificationType}' and user_id = '${userId}'`,
  });

  return userPreference.isSubscribed;
};
