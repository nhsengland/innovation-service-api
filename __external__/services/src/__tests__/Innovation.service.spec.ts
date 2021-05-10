import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
} from "@domain/index";
import { getConnection } from "typeorm";
import { AccessorService } from "../services/Accessor.service";
import { CommentService } from "../services/Comment.service";
import { InnovationService } from "../services/Innovation.service";
import { InnovatorService } from "../services/Innovator.service";
import { OrganisationService } from "../services/Organisation.service";

const dummy = {
  innovatorId: "innovatorId",
  accessorId: "accessorId",
};

describe("Innovator Service Suite", () => {
  let accessorService: AccessorService;
  // let actionService: ActionService;
  let commentService: CommentService;
  let innovationService: InnovationService;
  let innovatorService: InnovatorService;
  let organisationService: OrganisationService;
  let qualAccessorUser: User;
  let innovatorUser: User;
  let accessorOrganisation: Organisation;
  let organisationAccessorUser: OrganisationUser;

  beforeAll(async () => {
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    commentService = new CommentService(process.env.DB_TESTS_NAME);
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);

    const innovator = new User();
    innovator.id = dummy.innovatorId;
    innovatorUser = await innovatorService.create(innovator);

    let organisationObj = Organisation.new({
      name: "my inno org",
      type: OrganisationType.INNOVATOR,
    });
    const innovatorOrganisation = await organisationService.create(
      organisationObj
    );
    await organisationService.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const qualAccessor = new User();
    qualAccessor.id = dummy.accessorId;
    qualAccessorUser = await accessorService.create(qualAccessor);

    organisationObj = Organisation.new({
      name: "my org name",
      type: OrganisationType.ACCESSOR,
    });
    accessorOrganisation = await organisationService.create(organisationObj);
    organisationAccessorUser = await organisationService.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Comment).execute();
    await query.from(InnovationAction).execute();
    await query.from(Innovation).execute();
  });

  it("should instantiate the innovation service", async () => {
    expect(innovationService).toBeDefined();
  });

  it("should throw invalid operation when findAll()", async () => {
    const innovation: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    await innovationService.create(innovation);

    let err;
    try {
      await innovationService.findAll({ name: "My Innovation" });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.message).toContain("Not implemented.");
  });

  it("should find all innovations by innovator Id when findAllByInnovator()", async () => {
    const innovation: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    await innovationService.create(innovation);

    const result = await innovationService.findAllByInnovator(
      dummy.innovatorId,
      { name: "My Innovation" }
    );

    expect(result.length).toBeGreaterThan(0);
  });

  it("should throw when id is null in findAllByInnovator()", async () => {
    let err;
    try {
      await innovationService.findAllByInnovator(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.message).toContain("Invalid userId. You must define the owner.");
  });

  it("should find all innovations by qualifying accessor when findAllByAccessor()", async () => {
    let innovation: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      organisationShares: [{ id: accessorOrganisation.id }],
    });
    await innovationService.create(innovation);

    innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "newAbc",
      name: "Innovation without sharing",
      description: "My Description",
      countryName: "UK",
    });
    await innovationService.create(innovation);

    const result = await innovationService.findAllByAccessor(
      qualAccessorUser.id,
      [organisationAccessorUser]
    );

    expect(result[0].length).toEqual(1);
    expect(result[1]).toEqual(1);
  });

  it("should find and paginate innovations by qualifying accessor when findAllByAccessor()", async () => {
    let tmpInnovation;
    for (let i = 0; i < 20; i++) {
      tmpInnovation = Innovation.new({
        owner: innovatorUser,
        surveyId: `survey_${i}`,
        name: `innovation_${i}`,
        description: `description_${i}`,
        countryName: "UK",
        organisationShares: [{ id: accessorOrganisation.id }],
      });
      await innovationService.create(tmpInnovation);
    }

    const count = 10;
    const page = 2;
    const result = await innovationService.findAllByAccessor(
      qualAccessorUser.id,
      [organisationAccessorUser],
      {
        take: count,
        skip: (page - 1) * count,
      }
    );

    expect(result[0].length).toEqual(10);
    expect(result[1]).toEqual(20);
  });

  it("should throw an error when findAllByAccessor() without userId", async () => {
    let err;
    try {
      await innovationService.findAllByAccessor(undefined, []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should return empty when findAllByAccessor() with a user without organisations", async () => {
    let err;
    try {
      await innovationService.findAllByAccessor("userId", []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should throw an error when findAllByAccessor() with user with invalid role", async () => {
    let err;

    const orgUser = OrganisationUser.new({
      role: InnovatorOrganisationRole.INNOVATOR_OWNER,
    });

    try {
      await innovationService.findAllByAccessor(dummy.innovatorId, [orgUser]);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should find the innovation by innovator Id and innovation Id when getInnovationOverview()", async () => {
    const innovationObj: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    const innovation = await innovationService.create(innovationObj);

    const result = await innovationService.getInnovationOverview(
      innovation.id,
      dummy.innovatorId
    );

    expect(result).toBeDefined();
    expect(result.ownerId).toBe(innovatorUser.id);
  });

  it("should throw an error when getInnovationOverview() without id", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(undefined, "id");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should throw an error when getInnovationOverview() without innovatorId", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview("id", undefined);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should find the innovation with comments by innovator Id and innovation Id when getInnovationOverview()", async () => {
    const innovationObj: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    const innovation = await innovationService.create(innovationObj);

    const commentObj = Comment.new({
      message: "myNewComment",
      user: innovatorUser,
      innovation,
    });
    await commentService.create(commentObj);

    const result = await innovationService.getInnovationOverview(
      innovation.id,
      dummy.innovatorId
    );

    expect(result).toBeDefined();
    expect(result.commentsCount).toBeGreaterThan(0);
  });
});
