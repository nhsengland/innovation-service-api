import {
  AccessorOrganisationRole,
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
import { CommentService } from "../services/Comment.service";
import * as fixtures from "../__fixtures__";

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

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
    });
    spyOn(helpers, "getUsersFromB2C").and.returnValues([
      { id: innovatorUser.id, displayName: ":INNOVATOR" },
      { id: qualAccessorUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

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

    await query.from(Innovation).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
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
      await commentService.create(innovatorRequestUser, "b", "");
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
      "My Comment"
    );

    expect(comment).toBeDefined();
  });

  it("should throw when createByAccessor() with invalid params", async () => {
    let err;
    try {
      await commentService.create(qAccessorRequestUser, "b", null);
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
        { id: ":id", type: UserType.ACCESSOR },
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
    const comment = await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Comment"
    );

    expect(comment).toBeDefined();
  });

  it("should find all comments by an Innovation", async () => {
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
    const comment = await commentService.create(
      innovatorRequestUser,
      innovation.id,
      "My Innovator Comment"
    );

    await commentService.create(
      qAccessorRequestUser,
      innovation.id,
      "My Accessor Comment",
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
});
