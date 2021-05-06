import {
  Innovation,
  Organisation,
  OrganisationUser,
  User,
} from "@domain/index";
import { getConnection } from "typeorm";
import { v4 as uuid } from "uuid";
import { InnovatorService } from "../services/Innovator.service";

describe("Innovator Service Suite", () => {
  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();
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

    item.isDeleted = true;

    const result = await innovatorService.update(item.id, item);

    expect(result.isDeleted).toEqual(true);
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
});
