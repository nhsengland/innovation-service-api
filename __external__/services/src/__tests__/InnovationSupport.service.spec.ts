import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationSection,
  InnovationSupport,
  InnovationSupportLog,
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
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationSupportService } from "../services/InnovationSupport.service";
import * as fixtures from "../__fixtures__";
import * as engines from "@engines/index";
import { NotificationService } from "@services/services/Notification.service";
import { LoggerService } from "@services/services/Logger.service";
import * as dotenv from "dotenv";
import * as path from "path";

describe("Innovation Support Suite", () => {
  let supportService: InnovationSupportService;
  let innovation: Innovation;

  let innovatorRequestUser: RequestUser;
  let accessorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    supportService = new InnovationSupportService(process.env.DB_TESTS_NAME);

    const innovatorUser = await fixtures.createInnovatorUser();
    const qualAccessorUser = await fixtures.createAccessorUser();
    const accessorUser = await fixtures.createAccessorUser();

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

    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnitQAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
    );
    const organisationUnitAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
      organisationShares: [{ id: accessorOrganisation.id }],
    });
    const innovations = await fixtures.saveInnovations(innovationObj);
    innovation = innovations[0];

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
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
    accessorRequestUser = fixtures.getRequestUser(
      accessorUser,
      organisationAccessorUser,
      organisationUnitAccessorUser
    );

    spyOn(engines, "emailEngines").and.returnValue([
      {
        key: EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
        handler: async function () {
          return [];
        },
      },
      {
        key: EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
        handler: async function () {
          return [];
        },
      },
      {
        key: EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST,
        handler: async function () {
          return [];
        },
      },
    ]);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

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
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Comment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
    await query.from(InnovationSupport).execute();
  });

  it("should create an support", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    const item = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
  });

  it("should create an support even when notification fails", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    spyOn(NotificationService.prototype, "create").and.throwError("error");
    spyOn(NotificationService.prototype, "sendEmail").and.throwError("error");

    const spy = spyOn(LoggerService.prototype, "error");

    const item = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    expect(spy).toHaveBeenCalled();
    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
  });

  it("should throw when create with invalid params", async () => {
    let err;
    try {
      await supportService.create(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when create without user organisations", async () => {
    let err;
    try {
      await supportService.create(
        { id: ":id", type: UserType.ACCESSOR },
        "a",
        {}
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("should find an support by innovator", async () => {
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    const item = await supportService.find(
      innovatorRequestUser,
      support.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(1);
  });

  it("should find an support by q. accessor", async () => {
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    const item = await supportService.find(
      qAccessorRequestUser,
      support.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(1);
  });

  it("should find an support by accessor", async () => {
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    const item = await supportService.find(
      accessorRequestUser,
      support.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(1);
  });

  it("should throw when find with invalid params", async () => {
    let err;
    try {
      await supportService.find(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find all supports by innovator", async () => {
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
    };

    await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    const item = await supportService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.length).toEqual(1);
  });

  it("should throw when findAllByInnovation with invalid params", async () => {
    let err;
    try {
      await supportService.findAllByInnovation(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should update an support status to add one accessor", async () => {
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    let supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [
        accessorRequestUser.organisationUnitUser.id,
        qAccessorRequestUser.organisationUnitUser.id,
      ],
      comment: "test comment 2",
    };
    await supportService.update(
      qAccessorRequestUser,
      support.id,
      innovation.id,
      supportObj
    );

    const item = await supportService.find(
      innovatorRequestUser,
      support.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.ENGAGING);
    expect(item.accessors.length).toEqual(2);
  });

  it("should update an support status to a non engaging status with actions", async () => {
    let supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    await fixtures.createInnovationAction(qAccessorRequestUser, innovation);

    supportObj = {
      status: InnovationSupportStatus.NOT_YET,
      accessors: [
        accessorRequestUser.organisationUnitUser.id,
        qAccessorRequestUser.organisationUnitUser.id,
      ],
      comment: null,
    };
    await supportService.update(
      qAccessorRequestUser,
      support.id,
      innovation.id,
      supportObj
    );

    const item = await supportService.find(
      innovatorRequestUser,
      support.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.NOT_YET);
    expect(item.accessors.length).toEqual(0);
  });

  it("should update an support status to a non engaging status without actions", async () => {
    let supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj
    );

    supportObj = {
      status: InnovationSupportStatus.NOT_YET,
      accessors: [
        accessorRequestUser.organisationUnitUser.id,
        qAccessorRequestUser.organisationUnitUser.id,
      ],
      comment: null,
    };
    await supportService.update(
      qAccessorRequestUser,
      support.id,
      innovation.id,
      supportObj
    );

    const item = await supportService.find(
      innovatorRequestUser,
      support.id,
      innovation.id
    );

    expect(item).toBeDefined();
    expect(item.status).toEqual(InnovationSupportStatus.NOT_YET);
    expect(item.accessors.length).toEqual(0);
  });

  it("should throw when accessor update with invalid params", async () => {
    let err;
    try {
      await supportService.update(null, null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when accessor update without user organisations", async () => {
    let err;
    try {
      await supportService.update(
        { id: ":id", type: UserType.ACCESSOR },
        "a",
        "a",
        {}
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });
});
