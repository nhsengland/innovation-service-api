import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationStatus,
  InnovatorOrganisationRole,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
} from "@domain/index";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import { AccessorService } from "../services/Accessor.service";
import { CommentService } from "../services/Comment.service";
import { InnovationService } from "../services/Innovation.service";
import { InnovatorService } from "../services/Innovator.service";
import { OrganisationService } from "../services/Organisation.service";
import * as helpers from "../helpers";

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
  let userService: UserService;
  let qualAccessorUser: User;
  let innovatorUser: User;
  let accessorOrganisation: Organisation;
  let organisationAccessorUser: OrganisationUser;

  beforeAll(async () => {
    //await setupTestsConnection();
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    commentService = new CommentService(process.env.DB_TESTS_NAME);
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    organisationService = new OrganisationService(process.env.DB_TESTS_NAME);
    userService = new UserService(process.env.DB_TESTS_NAME);

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
    //closeTestsConnection();
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

  it("should find the innovation with NEEDS_ASSESSMENT and return an assessment innovation summary", async () => {
    const innovationObj: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    });

    const innovation = await innovationService.create(innovationObj);

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: ":display_name",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    spyOn(userService, "getProfile").and.returnValue({
      id: innovation.id,
      displayName: ":displayName",
      type: null,
      organisations: [
        {
          id: ":id_1",
          name: ":organisation_name",
          role: InnovatorOrganisationRole.INNOVATOR_OWNER,
        },
      ],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

    const result = await innovationService.getAssessmentInnovationSummary(
      innovation.id
    );

    expect(result).toBeDefined();
  });

  it("should list innovations within the list of statuses", async () => {
    const innovationObj1: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    });

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        displayName: ":display_name",
      },
    ]);

    spyOn(
      innovationService as any,
      "extractEngagingOrganisationAcronyms"
    ).and.returnValue(["ABC", "FGH"]);

    await innovationService.create(innovationObj1);

    const innovationObj2: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc2",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      status: InnovationStatus.IN_PROGRESS,
    });

    await innovationService.create(innovationObj2);

    const result = await innovationService.getInnovationListByState([
      InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    ]);

    expect(result.count).toBe(1);
  });

  it("should list innovations within the list of statuses (multiple)", async () => {
    const innovationObj1: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    });

    spyOn(helpers, "authenticateWitGraphAPI").and.returnValue(":access_token");
    spyOn(helpers, "getUsersFromB2C").and.returnValue([
      {
        displayName: ":display_name",
      },
    ]);

    spyOn(
      innovationService as any,
      "extractEngagingOrganisationAcronyms"
    ).and.returnValue(["ABC", "FGH"]);

    await innovationService.create(innovationObj1);

    const innovationObj2: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc2",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      status: InnovationStatus.IN_PROGRESS,
    });

    await innovationService.create(innovationObj2);

    const result = await innovationService.getInnovationListByState([
      InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      InnovationStatus.IN_PROGRESS,
    ]);

    expect(result.count).toBe(2);
  });
});
