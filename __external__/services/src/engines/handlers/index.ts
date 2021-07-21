import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  Innovation,
  InnovationSupport,
  InnovationSupportStatus,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { EmailResponse, EmailService } from "@services/services/Email.service";
import { getRepository } from "typeorm";
import * as helpers from "../../helpers";
import * as config from '@config/index';
import { EmailTemplateNotFound, InvalidParamsError } from "@services/errors";

export const accessorsActionToReviewHandler = async (
  requestUser: RequestUser,
  params: {
    innovationId: string,
    contextId: string,
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
  const action_url = parseUrl(params, EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW);

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
    innovationId: string,
    contextId: string,
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const qa_name = b2cUser.displayName;
  const innovation_url = parseUrl(params, EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION);
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
    innovationId: string,
    contextId: string,
  },
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {

  const innovationRepo = getRepository(Innovation, connectionName);
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const innovation = await innovationRepo.findOne(params.innovationId, { relations: ['owner']});

  const accessor_name = b2cUser.displayName;
  const unit_name = requestUser.organisationUnitUser.organisationUnit.name;
  const action_url = parseUrl(params, EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST);
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

const parseUrl = (params, templateCode): string => {
  const baseUrl = config.default.get('clients.web');
  const template = config.default.get('email.templates')?.find(t => t.code === templateCode);
  if (!template) throw new EmailTemplateNotFound('Could not find email template');

  const path = template.path;
  let url = path.url;
  const parameters = Object.keys(path.params);

  for (const param of parameters) {
    if (!params[param]) throw new InvalidParamsError(`Parameter ${param} is required.`);
    url = url.replace(`:${param}`, params[param]);
  }

  return `${baseUrl}/${url}`;
}

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
