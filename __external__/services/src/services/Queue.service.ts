import { QueueClient, QueueServiceClient } from "@azure/storage-queue";
import { QueueMessageConfig } from "@services/config/queue";

import { QueueMessageEnum, QueuesEnum } from "@services/enums/queue.enum";
import { DisplayNameUpdateIdentityQueueType, QueueContextType, UserLockIdentityQueueType, UserUnlockIdentityQueueType } from "@services/types/queue";
import { randomUUID } from "crypto";

import * as dotenv from "dotenv";
import { LoggerService } from "./Logger.service";

dotenv.config();

if (
  !process.env.AZURE_STORAGE_CONNECTIONSTRING ||
  !process.env.AZURE_STORAGE_QUEUE_NAME
) {
  console.error(
    "Storage Queue configurations undefined. Please, make sure environment variables are in place!"
  );
}

export const STORAGE_QUEUE_CONFIG = Object.freeze({
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTIONSTRING || "",
  storageQueueName: process.env.AZURE_STORAGE_QUEUE_NAME || "",
});

export class QueueService {
  logger: LoggerService;
  queueClient: QueueClient;
  queueServiceClient: QueueServiceClient;

  constructor() {
    this.logger = new LoggerService();
  }

  async createQueueMessage<T extends QueueMessageEnum>(
    messageType: T,
    data: QueueContextType<T>
  ): Promise<boolean> {

    const correlationId = randomUUID();

    const { queue } = this.getQueueConfig<T>(messageType);

    this.validateQueueName<T>(queue, correlationId, messageType);

    await this.init(queue);

    const message = {
      correlationId,
      messageType,
      data,
    }

    const payload = Buffer.from(JSON.stringify(message)).toString('base64');

    const response = await this.queueClient.sendMessage(payload);

    return response._response.status === 201;
    
  }

  async handleMessage<T extends QueueMessageEnum>(messageType: T, data: QueueContextType<T>, correlationId: string): Promise<{success: boolean, extra: unknown}> {

    const { handler, queue} = this.getQueueConfig(messageType);
    
    this.validateHandler<T>(handler, correlationId, messageType);

    const result = await handler(queue, data as QueueContextType<T>)

    return result;
  }

  /**
   * PRIVATE METHODS
   */

  private async init(queueName?: string) {
    const _connectionString = process.env
      .AZURE_STORAGE_CONNECTIONSTRING as string;
    this.queueServiceClient = QueueServiceClient.fromConnectionString(
      _connectionString
    );

    this.queueClient = this.queueServiceClient.getQueueClient(
      queueName || (process.env.AZURE_STORAGE_QUEUE_NAME as string)
    );
    await this.queueClient.createIfNotExists();
  }

  private validateQueueName<T extends QueueMessageEnum>(queueName: QueuesEnum, requestId: string, messageType: T) {
    if (!queueName) {
      this.logger.error(
        `[createQueueMessage] empty queueName. Request: ${requestId}`,
        {
          config: QueueMessageConfig[messageType],
        }
      );

      throw new Error(
        `[createQueueMessage] empty queueName. Check AppInsights for details for request with id: ${requestId} `
      );
    }
  }

  private validateHandler<T extends QueueMessageEnum>(handler: unknown, correlationId: string, messageType: T){
    if (!handler) {
      this.logger.error(
        `[createQueueMessage] empty handler. Request: ${correlationId}`,
        {
          config: QueueMessageConfig[messageType],
        }
      );
      throw new Error(
        `[createQueueMessage] empty handler. Check AppInsights for details for request with id: ${correlationId} `
      );
    }
  }

  private getQueueConfig<T extends QueueMessageEnum>(messageType: T) {
    return QueueMessageConfig[messageType];
  }

}
