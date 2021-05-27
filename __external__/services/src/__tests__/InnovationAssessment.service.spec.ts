import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAssessment,
  MaturityLevelCatalogue,
  Organisation,
  OrganisationType,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { AccessorService } from "@services/services/Accessor.service";
import { OrganisationService } from "@services/services/Organisation.service";
import { UserService } from "@services/services/User.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationService } from "../services/Innovation.service";
import { InnovationAssessmentService } from "../services/InnovationAssessment.service";
import { InnovatorService } from "../services/Innovator.service";

const dummy = {
  qAccessorId: "qAccessorId",
  accessorId: "accessorId",
  innovatorId: "innovatorId",
  assessmentUserId: "assessmentUserId",
  assessment: {
    description: "Assessment Desc",
  },
};

describe("Innovation Assessment Suite", () => {
  let assessmentService: InnovationAssessmentService;
  let userService: UserService;
  let innovation: Innovation;
  let organisationQuaAccessorUser: OrganisationUser;
  let organisationAccessorUser: OrganisationUser;

  beforeAll(async () => {
    // await setupTestsConnection();
    const accessorService = new AccessorService(process.env.DB_TESTS_NAME);
    const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    const organisationService = new OrganisationService(
      process.env.DB_TESTS_NAME
    );

    assessmentService = new InnovationAssessmentService(
      process.env.DB_TESTS_NAME
    );
    userService = new UserService(process.env.DB_TESTS_NAME);

    const innovator = new User();
    innovator.id = dummy.innovatorId;
    const innovatorUser = await innovatorService.create(innovator);

    const assessmentUser = new User();
    assessmentUser.id = dummy.assessmentUserId;
    assessmentUser.type = UserType.ASSESSMENT;
    await userService.create(assessmentUser);

    const qualAccessor = new User();
    qualAccessor.id = dummy.qAccessorId;
    const qualAccessorUser = await accessorService.create(qualAccessor);

    const accessor = new User();
    accessor.id = dummy.accessorId;
    const accessorUser = await accessorService.create(accessor);

    organisationAccessorUser;

    const organisationObj = Organisation.new({
      name: "my org name",
      type: OrganisationType.ACCESSOR,
    });
    const accessorOrganisation = await organisationService.create(
      organisationObj
    );
    organisationQuaAccessorUser = await organisationService.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );

    organisationAccessorUser = await organisationService.addUserToOrganisation(
      accessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.ACCESSOR
    );

    const innovationObj = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    innovation = await innovationService.create(innovationObj);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

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

    await query.from(InnovationAssessment).execute();
  });

  it("should instantiate the innovation assessment service", async () => {
    expect(assessmentService).toBeDefined();
  });

  it("should create an assessment", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const item = await assessmentService.create(
      dummy.innovatorId,
      innovation.id,
      assessmentObj
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should find an assessment by innovation id", async () => {
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
      id: dummy.assessmentUserId,
      displayName: ":displayName",
      type: UserType.ASSESSMENT,
      organisations: [],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const assessment = await assessmentService.create(
      dummy.assessmentUserId,
      innovation.id,
      assessmentObj
    );

    const item = await assessmentService.find(assessment.id, innovation.id);

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });

  it("should update an assessment without submission", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const assessment = await assessmentService.create(
      dummy.innovatorId,
      innovation.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      test: "test",
    };
    const item = await assessmentService.update(
      assessment.id,
      dummy.assessmentUserId,
      innovation.id,
      updAssessment
    );

    expect(item).toBeDefined();
    expect(item.maturityLevel).toEqual(MaturityLevelCatalogue.ADVANCED);
  });

  it("should update an assessment with submission", async () => {
    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const assessment = await assessmentService.create(
      dummy.innovatorId,
      innovation.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      isSubmission: true,
      test: "test",
    };
    const item = await assessmentService.update(
      assessment.id,
      dummy.assessmentUserId,
      innovation.id,
      updAssessment
    );

    expect(item).toBeDefined();
    expect(item.maturityLevel).toEqual(MaturityLevelCatalogue.ADVANCED);
    expect(item.finishedAt).toBeDefined();
  });

  it("should find an assessment by qualifying accessor", async () => {
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
      id: dummy.assessmentUserId,
      displayName: ":displayName",
      type: UserType.ASSESSMENT,
      organisations: [],
      email: "test_user@example.com",
      phone: "+351960000000",
    });

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovation.id,
      assignTo: dummy.assessmentUserId,
    };

    const assessment = await assessmentService.create(
      dummy.assessmentUserId,
      innovation.id,
      assessmentObj
    );

    const item = await assessmentService.findByAccessor(
      assessment.id,
      innovation.id,
      [organisationQuaAccessorUser]
    );

    expect(item).toBeDefined();
    expect(item.description).toEqual(dummy.assessment.description);
  });
});
