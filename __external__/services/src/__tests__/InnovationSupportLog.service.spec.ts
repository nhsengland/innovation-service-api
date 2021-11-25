import {
  AccessorOrganisationRole,
  ActivityLog,
  Comment,
  Innovation,
  InnovationAction,
  InnovationSection,
  InnovationSupport,
  InnovationSupportLog,
  InnovationSupportLogType,
  InnovationSupportStatus,
  Notification,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import {
  InvalidParamsError,
  MissingUserOrganisationError,
} from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationSupportLogService } from "../services/InnovationSupportLog.service";
import * as fixtures from "../__fixtures__";

describe("Innovation Support Suite", () => {
  let supportLogService: InnovationSupportLogService;
  let innovation: Innovation;

  let innovatorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;
  let organisationUnit: OrganisationUnit;

  let accessorUser: User;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    supportLogService = new InnovationSupportLogService(
      process.env.DB_TESTS_NAME
    );

    const innovatorUser = await fixtures.createInnovatorUser();
    const qualAccessorUser = await fixtures.createAccessorUser();
    accessorUser = await fixtures.createAccessorUser();

    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationQAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationAccessorUser = await fixtures.addUserToOrganisation(
      accessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
    );

    organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnitQAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
    );
    await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    const innovations = await fixtures.saveInnovations(innovationObj);
    innovation = innovations[0];

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Q Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "example@bjss.com",
        },
      ],
    });

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser,
      organisationUnitQAccessorUser
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovation,
      qAccessorRequestUser.organisationUnitUser.id
    );
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Comment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
    await query.from(InnovationSupport).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationSupportLog).execute();
  });

  it("should create a STATUS_UPDATE support log", async () => {
    const supportLogObj = {
      type: InnovationSupportLogType.STATUS_UPDATE,
      description: ":description",
    };

    const item = await supportLogService.create(
      qAccessorRequestUser,
      innovation.id,
      supportLogObj
    );

    expect(item).toBeDefined();
    expect(item.innovationSupportStatus).toEqual(
      InnovationSupportStatus.ENGAGING
    );
  });

  it("should create a ACCESSOR_SUGGESTION support log", async () => {
    const supportLogObj = {
      type: InnovationSupportLogType.ACCESSOR_SUGGESTION,
      description: ":description",
      organisationUnits: [organisationUnit.id],
    };

    const item = await supportLogService.create(
      qAccessorRequestUser,
      innovation.id,
      supportLogObj
    );

    expect(item).toBeDefined();
    expect(item.innovationSupportStatus).toEqual(
      InnovationSupportStatus.ENGAGING
    );
  });

  it("should throw when create with invalid params", async () => {
    let err;
    try {
      await supportLogService.create(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when create with invalid support log params", async () => {
    let err;
    try {
      await supportLogService.create(
        { id: ":id", type: UserType.ACCESSOR },
        "a",
        {}
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when create without user organisations", async () => {
    let err;
    try {
      await supportLogService.create(
        { id: ":id", type: UserType.ACCESSOR },
        "a",
        {
          type: InnovationSupportLogType.ACCESSOR_SUGGESTION,
          description: ":description",
        }
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("should find all support logs by innovation", async () => {
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: accessorUser.id,
        displayName: ":ACCESSOR",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "example@bjss.com",
          },
        ],
      },
      {
        id: qAccessorRequestUser.id,
        displayName: ":QUALIFYING_ACCESSOR",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "example@bjss.com",
          },
        ],
      },
    ]);

    await supportLogService.create(qAccessorRequestUser, innovation.id, {
      type: InnovationSupportLogType.STATUS_UPDATE,
      description: ":description",
    });

    await supportLogService.create(qAccessorRequestUser, innovation.id, {
      type: InnovationSupportLogType.ACCESSOR_SUGGESTION,
      description: ":description",
      organisationUnits: [organisationUnit.id],
    });

    const item = await supportLogService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(2);
  });

  it("should find all support logs by innovation and type", async () => {
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: accessorUser.id,
        displayName: ":ACCESSOR",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "example@bjss.com",
          },
        ],
      },
      {
        id: qAccessorRequestUser.id,
        displayName: ":QUALIFYING_ACCESSOR",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "example@bjss.com",
          },
        ],
      },
    ]);

    await supportLogService.create(qAccessorRequestUser, innovation.id, {
      type: InnovationSupportLogType.STATUS_UPDATE,
      description: ":description",
    });

    await supportLogService.create(qAccessorRequestUser, innovation.id, {
      type: InnovationSupportLogType.ACCESSOR_SUGGESTION,
      description: ":description",
      organisationUnits: [organisationUnit.id],
    });

    const item = await supportLogService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id,
      InnovationSupportLogType.ACCESSOR_SUGGESTION
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(1);
  });

  it("should throw when findAllByInnovation with invalid params", async () => {
    let err;
    try {
      await supportLogService.findAllByInnovation(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });
});
