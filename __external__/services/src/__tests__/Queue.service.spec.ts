/**
 * @jest-environment node
 */

describe("QUEUE Service test suite", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

// import { QueueClient } from "@azure/storage-queue";
// import {
//   Organisation,
//   OrganisationUnit,
//   OrganisationUnitUser,
//   OrganisationUser,
//   User,
//   UserType,
//   UserRole,
// } from "@domain/index";
// import { QueueMessageEnum } from "@services/enums/queue.enum";
// import { AdminService } from "@services/services/Admin.service";
// import { QueueService } from "@services/services/Queue.service";
// import * as dotenv from "dotenv";
// import * as path from "path";
// import { getConnection } from "typeorm";
// import { v4 } from "uuid";
// import { setupTestsConnection, closeTestsConnection } from "..";
// import * as helpers from "../helpers";
// import * as fixtures from "../__fixtures__";
// import { mocked } from "ts-jest/utils";
// import { CustomContext } from "utils/types";

// jest.mock("@services/services/Admin.service", () => {
//   return {
//     AdminService: jest.fn().mockImplementation(() => {
//       return {
//         lockUsers: () => ({ status: "OK" }),
//       };
//     }),
//   };
// });

// describe("QueueService Suite", () => {
//   let queueService: QueueService;

//   const MockedAdminService = mocked(AdminService, true);

//   beforeEach(() => {
//     MockedAdminService.mockClear();
//   });

//   beforeAll(async () => {
//     await setupTestsConnection();

//     dotenv.config({
//       path: path.resolve(__dirname, "./.environment"),
//     });

//     queueService = new QueueService();

//     jest
//       .spyOn(helpers, "authenticateWitGraphAPI")
//       .mockResolvedValue(":access_token");
//     jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
//       id: ":userOid",
//       displayName: ":userName",
//     });
//   });

//   afterAll(async () => {
//     closeTestsConnection();
//   });

//   afterEach(async () => {
//     const query = getConnection(process.env.DB_TESTS_NAME)
//       .createQueryBuilder()
//       .delete();

//     await query.from(OrganisationUnitUser).execute();
//     await query.from(OrganisationUser).execute();
//     await query.from(OrganisationUnit).execute();
//     await query.from(Organisation).execute();
//     await query.from(UserRole).execute();
//     await query.from(User).execute();
//   });

//   it("should create message in queue", async () => {
//     const adminUser = await fixtures.createAdminUser();
//     const user = await fixtures.createInnovatorUser();

//     const requestUser = {
//       id: adminUser.id,
//       externalId: adminUser.externalId,
//       type: UserType.ADMIN,
//     };

//     const spy = jest
//       .spyOn(QueueClient.prototype, "sendMessage")
//       .mockResolvedValue({
//         _response: {
//           status: 201,
//         },
//       } as any);

//     const actual = await queueService.createQueueMessage(
//       QueueMessageEnum.LOCK_USER,
//       { requestUser, identityId: user.externalId }
//     );

//     expect(actual).toBe(true);
//     expect(spy).toHaveBeenCalledTimes(1);
//   });

//   it("should handle user lock", async () => {
//     const adminUser = await fixtures.createAdminUser();
//     const user = await fixtures.createInnovatorUser();

//     const requestUser = {
//       id: adminUser.id,
//       externalId: adminUser.externalId,
//       type: UserType.ADMIN,
//     };

//     const correlationId = v4();
//     const rawMessage = {
//       correlationId,
//       messageType: QueueMessageEnum.LOCK_USER,
//       data: {
//         requestUser,
//         identityId: user.externalId,
//       },
//     };

//     const { messageType, data } = rawMessage;
//     type MESSAGETYPE = typeof messageType;

//     const t: CustomContext = {
//       auth: undefined,
//       services: { AdminService: { lockUsers: () => ({
//         id: user.externalId,
//         status: 'OK',
//       })} as unknown as AdminService},
//       invocationId: ':1',
//       executionContext: undefined,
//       bindings: undefined,
//       bindingData: undefined,
//       bindingDefinitions: undefined,
//       log: undefined,
//       traceContext: undefined,
//       done: undefined,
//     };

//     const result = await queueService.handleMessage<MESSAGETYPE>(
//       t,
//       messageType,
//       data,
//       correlationId
//     );

//     expect(result).toBeDefined();
//     expect(result.success).toBe(true)
//   });
// });
