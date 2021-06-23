import { getConnection } from "typeorm";
import { CommentService } from "../services/Comment.service";
import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import * as fixtures from "../__fixtures__";
import * as helpers from "../helpers";
import { closeTestsConnection, setupTestsConnection } from "..";
import {
  InvalidParamsError,
  MissingUserOrganisationError,
} from "@services/errors";

describe("Comment Service Suite", () => {
  let commentService: CommentService;
  let innovatorUser: User;
  let qualAccessorUser: User;
  let innovation: Innovation;
  let qAccessorUserOrganisations: OrganisationUser[];

  beforeAll(async () => {
    // await setupTestsConnection();
    commentService = new CommentService(process.env.DB_TESTS_NAME);

    qualAccessorUser = await fixtures.createAccessorUser();
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationQuaAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQuaAccessorUser,
      organisationUnit
    );
    qAccessorUserOrganisations = await fixtures.findUserOrganisations(
      qualAccessorUser.id
    );

    innovatorUser = await fixtures.createInnovatorUser();
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
      await commentService.create("a", "b", "");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should create a comment by innovator", async () => {
    const comment = await commentService.create(
      innovatorUser.id,
      innovation.id,
      "My Comment"
    );

    expect(comment).toBeDefined();
  });

  it("should throw when createByAccessor() with invalid params", async () => {
    let err;
    try {
      await commentService.createByAccessor("a", "b", "", []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when createByAccessor() with without organisations", async () => {
    let err;
    try {
      await commentService.createByAccessor("a", "b", "message", []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("should create a comment by accessor", async () => {
    const comment = await commentService.createByAccessor(
      qualAccessorUser.id,
      innovation.id,
      "My Comment",
      qAccessorUserOrganisations
    );

    expect(comment).toBeDefined();
  });

  it("should find all comments by an Innovation", async () => {
    await commentService.create(innovatorUser.id, innovation.id, "My Comment");

    const result = await commentService.findAllByInnovation(
      innovatorUser.id,
      innovation.id
    );

    expect(result).toBeDefined();
  });

  it("should find all comments by an Accessor", async () => {
    const comment = await commentService.create(
      innovatorUser.id,
      innovation.id,
      "My Innovator Comment"
    );

    await commentService.createByAccessor(
      qualAccessorUser.id,
      innovation.id,
      "My Accessor Comment",
      qAccessorUserOrganisations,
      comment.id
    );

    await commentService.createByAccessor(
      qualAccessorUser.id,
      innovation.id,
      "My Second Accessor Comment",
      qAccessorUserOrganisations
    );

    const result = await commentService.findAllByInnovation(
      qualAccessorUser.id,
      innovation.id,
      qAccessorUserOrganisations
    );

    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
  });
});
