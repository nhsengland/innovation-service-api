import { QueueMessageEnum } from "@services/enums/queue.enum";
import { QueueContextType } from "@services/types/queue";
import { AppInsights, SQLConnector } from "utils/decorators";
import { CustomContext } from "utils/types";

class AdminsLockUsersQueue {

  @SQLConnector()
  static async queueTrigger(
    context: CustomContext,
    message: {
      correlationId: string;
      messageType: QueueMessageEnum;
      data: QueueContextType<QueueMessageEnum>;
    }
  ): Promise<void> {
    // get message type

    const { correlationId, messageType, data } = message;

    // get handler response with email addresses

    type MESSAGETYPE = typeof messageType;

    const result = await context.services.QueueService.handleMessage<MESSAGETYPE>(
      context,
      messageType,
      data,
      correlationId
    );

    context.res = result;
  }
}

export default AdminsLockUsersQueue.queueTrigger;
