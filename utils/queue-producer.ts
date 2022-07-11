import {
  QueueClient,
  QueueSendMessageOptions,
  QueueSendMessageResponse,
  QueueServiceClient,
} from "@azure/storage-queue";
import { get, set } from "../utils/cache";

export class QueueProducer {
  private queueClient: QueueClient;
  private queueServiceClient: QueueServiceClient;
  private QUEUE_NAME = "notification-queue";

  private async init(queueName?: string) {
    this.queueClient = get("queue-client") as QueueClient;
    this.queueServiceClient = get("queue-service-client") as QueueServiceClient;

    if (!this.queueClient || !this.queueServiceClient) {
      const _connectionString = process.env
        .AZURE_STORAGE_CONNECTIONSTRING as string;

      this.queueServiceClient = QueueServiceClient.fromConnectionString(
        _connectionString
      );
      this.queueClient = this.queueServiceClient.getQueueClient(
        queueName || (process.env.AZURE_STORAGE_QUEUE_NAME as string)
      );

      await this.queueClient.createIfNotExists();

      set("queue-client", this.queueClient);
      set("queue-service-client", this.queueServiceClient);
    }
  }

  async sendMessage(
    message: { [key: string]: any },
    queueName?: string,
    opts?: QueueSendMessageOptions
  ): Promise<QueueSendMessageResponse> {
    await this.init(queueName || this.QUEUE_NAME);

    const payload = JSON.stringify(message);

    const response = await this.queueClient.sendMessage(
      Buffer.from(payload).toString("base64"),
      opts
    );

    return response;
  }
}
