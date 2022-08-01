import { QueueMessageEnum, QueuesEnum } from "@services/enums/queue.enum";
import {
  DisplayNameUpdateIdentityQueueType,
  UserLockIdentityQueueType,
  UserUnlockIdentityQueueType,
} from "@services/types/queue";
import { CustomContext } from "utils/types";
import { lockUserIdentityQueueHandler } from "./handlers";

export const QueueMessageConfig: {
  [QueueMessageEnum.LOCK_USER]: {
    queue?: QueuesEnum;
    context?: UserLockIdentityQueueType;
    handler?: (
      queueContext: CustomContext,
      queue: QueuesEnum,
      context: UserLockIdentityQueueType
    ) => Promise<{ success: boolean; extra?: unknown }>;
  };
  [QueueMessageEnum.UNLOCK_USER]: {
    queue?: QueuesEnum;
    context?: UserUnlockIdentityQueueType;
    handler?: (
      queueContext: CustomContext,
      queue: QueuesEnum,
      context: UserUnlockIdentityQueueType
    ) => Promise<{ success: boolean; extra?: unknown }>;
  };
  [QueueMessageEnum.UPDATE_DISPLAY_NAME]: {
    queue?: QueuesEnum;
    context?: DisplayNameUpdateIdentityQueueType;
    handler?: (
      queueContext: CustomContext,
      queue: QueuesEnum,
      context: DisplayNameUpdateIdentityQueueType
    ) => Promise<{ success: boolean; extra?: unknown }>;
  };
} = {
  LOCK_USER: {
    queue: QueuesEnum.IDENTITY_OPERATIONS,
    handler: lockUserIdentityQueueHandler,
  },
  UNLOCK_USER: {
    queue: QueuesEnum.IDENTITY_OPERATIONS,
  },
  UPDATE_DISPLAY_NAME: {
    queue: QueuesEnum.IDENTITY_OPERATIONS,
  },
};
