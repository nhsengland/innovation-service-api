import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  Innovation,
  InnovationSupport,
  InnovationSupportStatus,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { EmailResponse, EmailService } from "@services/services/Email.service";
import { getRepository } from "typeorm";
import * as helpers from "@helpers/index";
import { getTemplates } from "../templates";
import { EmailTemplateNotFound, InvalidParamsError } from "@services/errors";

export const accessorsActionToReviewHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const innovationRepo = getRepository(Innovation, connectionName);

  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId);

  const innovator_name = b2cUser.displayName;

  const innovation_name = innovation.name;
  const action_url = parseUrl(
    params,
    EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW
  );

  const recipients = await getRecipients(params.innovationId, connectionName);
  const props = {
    innovator_name,
    innovation_name,
    action_url,
  };

  const result = await emailService.send(
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
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
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

  const result = await emailService.send(
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
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
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

  const result = await emailService.send(
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

  const result = await emailService.send(
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
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId, {
    relations: ["owner"],
  });

  const transfer_url = parseUrl(
    params,
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_NEW_USER
  );

  const props = {
    innovator_name: b2cUser.displayName,
    innovation_name: innovation.name,
    transfer_url,
  };

  const recipients = targetUsers;

  const result = await emailService.send(
    recipients,
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
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId, {
    relations: ["owner"],
  });

  const transfer_url = parseUrl(
    params,
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER
  );

  const props = {
    innovator_name: b2cUser.displayName,
    innovation_name: innovation.name,
    transfer_url,
  };

  const recipients = targetUsers;

  const result = await emailService.send(
    recipients,
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER,
    props
  );

  return result;
};

// TODO : FINISH EMAIL HANDLER
export const innovatorsTransferOwnershipConfirmation = async (
  requestUser: RequestUser,
  params: {
    innovationId: string;
    contextId: string;
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId, {
    relations: ["owner"],
  });

  // TODO : REVIEW PARAMETERS
  const props = {
    innovator_name: "",
    innovation_name: innovation.name,
    new_innovator_name: b2cUser.displayName,
    new_innovator_email: "",
  };

  const recipients = targetUsers;

  const result = await emailService.send(
    recipients,
    EmailNotificationTemplate.INNOVATORS_TRANSFER_OWNERSHIP_CONFIRMATION,
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
