import {
  ActivityLog,
  Innovation,
  InnovationStatus,
  Organisation,
  OrganisationUser,
  OrganisationType,
  User,
  UserRole,
  UserType,
} from "@domain/index";
import { getConnection } from "typeorm";
import { v4 as uuid } from "uuid";
import { InnovatorService } from "../services/Innovator.service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fixtures from "../__fixtures__";
import { UserService } from "@services/services/User.service";
import { InnovationService } from "@services/services/Innovation.service";
import * as helpers from "../../src/helpers/index";
import { closeTestsConnection, setupTestsConnection } from "..";
import { NotificationService } from "@services/services/Notification.service";

describe("Innovator Service Suite", () => {
  let userService: UserService;
  let innovationService: InnovationService;
  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });

    userService = new UserService(process.env.DB_TESTS_NAME);
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
  });
  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(ActivityLog).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
    await query.from(UserRole).execute();
    await query.from(User).execute();
    // await closeTestsConnection();
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(Innovation).execute();
    await closeTestsConnection();
  });

  it("should instantiate the innovator service", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);

    expect(innovatorService).toBeDefined();
  });

  it("should create an innovator", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    const item = await innovatorService.create(innovator);

    expect(item.id).toEqual(innovator.id);
  });

  it("should fail to create an innovator without oid", async () => {
    let err;
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();

    try {
      await innovatorService.create(innovator);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should find one innovator", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    const item = await innovatorService.create(innovator);

    const result = await innovatorService.find(item.id);

    expect(result.id).toEqual(innovator.id);
  });

  it("should find all innovators", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    await innovatorService.create(innovator);

    const result = await innovatorService.findAll();

    expect(result.length).toBeGreaterThan(0);
  });

  it("should update an innovator", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    const item = await innovatorService.create(innovator);

    item.deletedAt = new Date();

    const result = await innovatorService.update(item.id, item);

    expect(result.deletedAt).toBeDefined();
  });

  it("should throw when updating inexistent innovator", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    let err;

    try {
      await innovatorService.update(uuid(), {} as User);
    } catch (error) {
      err = error;
    }

    expect(err).not.toBeNull();
    expect(err).not.toBeUndefined();
  });

  it("should create first time sign in", async () => {
    // Arrange
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    const innovation = new Innovation();
    const organisation = new Organisation();
    innovator.id = "abcdefghijkl";

    organisation.name = "Test Org #1";
    organisation.size = "1 to 5 employees";

    innovation.name = "HealthyTalk";
    innovation.surveyId = "abc-def-ghi";
    innovation.description = "description";
    innovation.countryName = "UK";

    jest.spyOn(UserService.prototype, "getProfile").mockResolvedValue({
      id: ":id",
      email: "test@example.com",
      displayName: ":displayName",
      type: UserType.INNOVATOR,
      organisations: [],
    });

    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");
    // Act

    const result = await innovatorService.createFirstTimeSignIn(
      innovator,
      innovation,
      organisation
    );

    // Assert

    expect(result).toBeDefined();
  });

  it("should find innovator by id", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    await innovatorService.create(innovator);

    const result = await innovatorService.find("abc-def-ghi");

    expect(result).toBeDefined();
  });

  it("should not find innovator by inexisting id", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    await innovatorService.create(innovator);

    const result = await innovatorService.find("random--oid");

    expect(result).toBeUndefined();
  });

  it("should not find innovator by inexisting id", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    await innovatorService.create(innovator);

    const result = await innovatorService.find(undefined);

    expect(result).toBeUndefined();
  });

  it("should not find innovator by inexisting id", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovator = new User();
    innovator.id = "abc-def-ghi";

    await innovatorService.create(innovator);

    const result = await innovatorService.find(null);

    expect(result).toBeUndefined();
  });

  it("should archive the innovation by innovator Id and innovation Id and delete user", async () => {
    const innovatorUser = await fixtures.createInnovatorUser();
    const fakeRequestUser = {
      requestUser: {
        id: innovatorUser.id,
        type: UserType.INNOVATOR,
      },
    };
    const innovationObj = fixtures.generateInnovation({
      owner: { id: fakeRequestUser.requestUser.id },
      surveyId: "abc",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);
    const connection = innovationService.getConnection();
    let result;
    jest
      .spyOn(innovationService, "findAllByInnovator")
      .mockResolvedValue(true as any);
    jest
      .spyOn(userService, "deleteAccount")
      .mockResolvedValue(fakeRequestUser.requestUser as any);
    return await connection.transaction(async (transactionManager) => {
      result = await innovationService.archiveInnovation(
        fakeRequestUser.requestUser,
        innovation.id,
        ":reason",
        transactionManager
      );
      expect(result).toBeDefined();
      expect(result.status).toBe(InnovationStatus.ARCHIVED);
    });
  });

  it("should throw error when delete the user ", async () => {
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const innovatorUser = await fixtures.createInnovatorUser();
    let err;
    try {
      await innovatorService.delete(innovatorUser, "test");
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
  });
});
