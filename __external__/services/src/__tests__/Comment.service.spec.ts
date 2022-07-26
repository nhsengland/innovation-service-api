import {
  AccessorOrganisationRole,
  ActivityLog,
  Comment,
  Innovation,
  Notification,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserRole,
  UserType,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidDataError,
  InvalidParamsError,
  MissingUserOrganisationError,
} from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { ActivityLogService } from "@services/services/ActivityLog.service";
import { LoggerService } from "@services/services/Logger.service";
import { OrganisationService } from "@services/services/Organisation.service";
import { UserService } from "@services/services/User.service";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { QueueProducer } from "../../../../utils/queue-producer";
import * as helpers from "../helpers";
import { CommentService } from "../services/Comment.service";
import * as fixtures from "../__fixtures__";
import { closeTestsConnection, setupTestsConnection } from "..";

describe("Comment Service Suite", () => {
  let commentService: CommentService;
  let innovation: Innovation;

  let innovatorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    commentService = new CommentService(process.env.DB_TESTS_NAME);

    const qualAccessorUser = await fixtures.createAccessorUser();
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationQAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnitQAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
    );

    const innovatorUser = await fixtures.createInnovatorUser();
    innovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: innovatorUser,
        surveyId: "abc",
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Q Accessor A",
    });
    jest
      .spyOn(QueueProducer.prototype, "sendNotification")
      .mockResolvedValue(undefined);

    jest.spyOn(LoggerService.prototype, "error");

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser,
      organisationUnitQAccessorUser
    );
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(Innovation).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(UserRole).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Comment).execute();
  });

  it("should instantiate the comment service", async () => {
    expect(commentService).toBeDefined();
  });

  it("should throw when create() with invalid params", async () => {
    let err;
    try {
      await commentService.create(innovatorRequestUser, "b", "", true);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should create a comment by innovator", async () => {
    const comment = await commentService.create(
      innovatorRequestUser,
      innovation.id,
      "My Comment",
      true
    );

    expect(comment).toBeDefined();
  });

  it("should rollback a comment if ActivityLog fails to log", async () => {
    jest
      .spyOn(ActivityLogService.prototype, "createLog")
      .mockRejectedValueOnce({ error: "Error" });

    let err;
    let comment;
    try {
      comment = await commentService.create(
        innovatorRequestUser,
        innovation.id,
        "My Comment",
        true
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(comment).toBeUndefined();
  });

  it("should throw when createByAccessor() with invalid params", async () => {
    let err;
    try {
      await commentService.create(qAccessorRequestUser, "b", null, true);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when createByAccessor() with without organisations", async () => {
    let err;
    try {
      await commentService.create(
        { id: ":id", externalId: ":id", type: UserType.ACCESSOR },
        "b",
        "message"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("should create a comment by accessor", async () => {
    jest
      .spyOn(OrganisationService.prototype, "findOrganisationUnitById")
      .mockResolvedValue({
        name: "Organisation Unit",
      } as any);

    jest
      .spyOn(UserService.prototype, "getProfile")
      .mockResolvedValue({ displayName: "Accessor Name" } as any);

    const comment = await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Comment"
    );

    expect(comment).toBeDefined();
  });

  it("should find all comments by an Innovation", async () => {
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: innovatorRequestUser.id, displayName: ":INNOVATOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    await commentService.create(
      innovatorRequestUser,
      innovation.id,
      "My Comment"
    );

    const result = await commentService.findAllByInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(result).toBeDefined();
  });

  it("should find all comments by an Accessor", async () => {
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: innovatorRequestUser.id, displayName: ":INNOVATOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const comment = await commentService.create(
      innovatorRequestUser,
      innovation.id,
      "My Innovator Comment"
    );

    await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Accessor Comment",
      true,
      comment.id
    );

    await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Second Accessor Comment"
    );

    const result = await commentService.findAllByInnovation(
      qAccessorRequestUser,
      innovation.id
    );

    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
  });

  it("should throw when findAllByInnovation() with invalid params", async () => {
    let err;
    try {
      await commentService.findAllByInnovation(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when findAllByInnovation() innovation id not present", async () => {
    let err;
    try {
      await commentService.findAllByInnovation(
        innovatorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw an error when create() innovation id not present", async () => {
    let err;
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: innovatorRequestUser.id, displayName: ":INNOVATOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    try {
      const result = await commentService.create(
        innovatorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B",
        "My Comment"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw when update() with invalid params", async () => {
    let err;
    try {
      await commentService.update(innovatorRequestUser, "b", "", "");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when update() with innovation id not present", async () => {
    let err;
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: innovatorRequestUser.id, displayName: ":INNOVATOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    try {
      const result = await commentService.update(
        innovatorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B",
        "My Comment",
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should update a comment by innovator", async () => {
    const comment = await commentService.create(
      innovatorRequestUser,
      innovation.id,
      "My Comment",
      true
    );

    const updateComment = await commentService.update(
      innovatorRequestUser,
      innovation.id,
      "My Comment",
      comment.id
    );
    expect(updateComment).toBeDefined();
  });

  it("should update a comment by accessor", async () => {
    jest
      .spyOn(OrganisationService.prototype, "findOrganisationUnitById")
      .mockResolvedValue({
        name: "Organisation Unit",
      } as any);

    jest
      .spyOn(UserService.prototype, "getProfile")
      .mockResolvedValue({ displayName: "Accessor Name" } as any);

    const comment = await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Comment",
      true
    );

    const updatecomment = await commentService.update(
      qAccessorRequestUser,
      innovation.id,
      "My Comment",
      comment.id
    );
    expect(updatecomment).toBeDefined();
  });

  it("should throw InvalidDataError when update a comment by accessor", async () => {
    jest
      .spyOn(OrganisationService.prototype, "findOrganisationUnitById")
      .mockResolvedValue({
        name: "Organisation Unit",
      } as any);

    jest
      .spyOn(UserService.prototype, "getProfile")
      .mockResolvedValue({ displayName: "Accessor Name" } as any);

    const comment = await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Comment"
    );

    let err;
    try {
      const updatecomment = await commentService.update(
        qAccessorRequestUser,
        innovation.id,
        "My Comment",
        comment.id
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidDataError);
  });
});
