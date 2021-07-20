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

export const accessorsActionToReviewHandler = async (
  requestUser: RequestUser,
  innovationId: string,
  contextId: string,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);

  const innovationRepo = getRepository(Innovation, connectionName);

  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const innovation = await innovationRepo.findOne(innovationId);

  const innovator_name = b2cUser.displayName;

  const innovation_name = innovation.name;
  const action_url = `https://example.com/${contextId}`;

  const recipients = await getRecipients(innovationId, connectionName);
  const props = {
    innovator_name,
    innovation_name,
    action_url,
  };

  const response: EmailResponse[] = [];

  for (const recipient of recipients) {
    const result = await emailService.send(
      recipient,
      EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
      props
    );
    response.push(result);
  }

  return response;
};

export const accessorsAssignedToInnovationHandler = async (
  requestUser: RequestUser,
  innovationId: string,
  contextId: string,
  targetUsers?: string[],
  connectionName?: string
): Promise<EmailResponse[]> => {
  const emailService = new EmailService(connectionName);
  const b2ctoken = await helpers.authenticateWitGraphAPI();
  const b2cUser = await helpers.getUserFromB2C(b2ctoken, requestUser.id);
  const qa_name = b2cUser.displayName;
  const innovation_url = `https://www.example.com/${innovationId}`;
  const props = {
    qa_name,
    innovation_url,
  };

  let recipients = targetUsers;
  recipients = recipients.filter((r) => r !== requestUser.id);

  const response: EmailResponse[] = [];

  for (const recipient of recipients) {
    const result = await emailService.send(
      recipient,
      EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
      props
    );
    response.push(result);
  }

  return response;
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
