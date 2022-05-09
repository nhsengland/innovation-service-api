import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  AccessorOrganisationRole,
  ActivityLog,
  Comment,
  Innovation,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportLog,
  InnovationSupportStatus,
  InnovatorOrganisationRole,
  MaturityLevelCatalogue,
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
import * as engines from "@engines/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  InvalidSectionStateError,
  InvalidUserRoleError,
  InvalidUserTypeError,
  MissingUserOrganisationError,
} from "@services/errors";
import { InnovationListModel } from "@services/models/InnovationListModel";
import { RequestUser } from "@services/models/RequestUser";
import { InnovationAssessmentService } from "@services/services/InnovationAssessment.service";
import { InnovationSupportService } from "@services/services/InnovationSupport.service";
import { LoggerService } from "@services/services/Logger.service";
import { NotificationService } from "@services/services/Notification.service";
import { UserService } from "@services/services/User.service";
import { SupportFilter } from "@services/types";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import { InnovationService } from "../services/Innovation.service";
import * as fixtures from "../__fixtures__";
import { ActivityLogService } from "@services/services/ActivityLog.service";
import axios from "axios";

describe("Innovator Service Suite", () => {
  let innovationService: InnovationService;
  let assessmentService: InnovationAssessmentService;
  let notificationService: NotificationService;
  let supportService: InnovationSupportService;

  let userService: UserService;
  let accessorOrganisation: Organisation;
  let accessorOrganisation2: Organisation;

  let innovatorRequestUser: RequestUser;
  let accessorRequestUser: RequestUser;
  let qAccessorRequestUser: RequestUser;
  let qAccessorRequestUser2: RequestUser;
  let assessmentRequestUser: RequestUser;
  let assessmentUser: User;

  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });

    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    assessmentService = new InnovationAssessmentService(
      process.env.DB_TESTS_NAME
    );
    notificationService = new NotificationService(process.env.DB_TESTS_NAME);

    userService = new UserService(process.env.DB_TESTS_NAME);
    supportService = new InnovationSupportService(process.env.DB_TESTS_NAME);

    const innovatorUser = await fixtures.createInnovatorUser();
    const innovatorOrganisation = await fixtures.createOrganisation(
      OrganisationType.INNOVATOR
    );
    await fixtures.addUserToOrganisation(
      innovatorUser,
      innovatorOrganisation,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );

    const qualAccessorUser = await fixtures.createAccessorUser();
    const qualAccessorUser2 = await fixtures.createAccessorUser();
    const accessorUser = await fixtures.createAccessorUser();
    assessmentUser = await fixtures.createAssessmentUser();

    accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    accessorOrganisation2 = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const organisationQAccessorUser = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationQAccessorUser2 = await fixtures.addUserToOrganisation(
      qualAccessorUser2,
      accessorOrganisation2,
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
    const organisationUnit2 = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationUnitQAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser,
      organisationUnit
    );
    const organisationUnitQAccessorUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationQAccessorUser2,
      organisationUnit2
    );
    const organisationUnitAccessorUser = await fixtures.addOrganisationUserToOrganisationUnit(
      organisationAccessorUser,
      organisationUnit
    );

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    assessmentRequestUser = fixtures.getRequestUser(assessmentUser);
    qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser,
      organisationUnitQAccessorUser
    );
    qAccessorRequestUser2 = fixtures.getRequestUser(
      qualAccessorUser2,
      organisationQAccessorUser2,
      organisationUnitQAccessorUser2
    );
    accessorRequestUser = fixtures.getRequestUser(
      accessorUser,
      organisationAccessorUser,
      organisationUnitAccessorUser
    );

    jest.spyOn(engines, "emailEngines").mockReturnValue([
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
    await query.from(UserRole).execute();
    await query.from(User).execute();
    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(InnovationSupportLog).execute();
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Comment).execute();
    await query.from(InnovationAssessment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSupport).execute();
    await query.from(InnovationSection).execute();
    await query.from(Innovation).execute();
  });

  it("should instantiate the innovation service", async () => {
    expect(innovationService).toBeDefined();
  });

  it("should log an error and carry on when NotificationService fails", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      surveyId: "abc",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    jest
      .spyOn(NotificationService.prototype, "create")
      .mockRejectedValue("error");
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");
    jest
      .spyOn(innovationService, "hasIncompleteSections")
      .mockResolvedValue(false);
    const spy = jest.spyOn(LoggerService.prototype, "error");

    const actual = await innovationService.submitInnovation(
      innovatorRequestUser,
      innovation.id
    );

    expect(spy).toHaveBeenCalled();
    expect(actual).toBeDefined();
  });

  it("should throw invalid operation when findAll()", async () => {
    const innovation: Innovation = Innovation.new({
      owner: { id: innovatorRequestUser.id },
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
    const innovation = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });
    await fixtures.saveInnovations(innovation);

    const result = await innovationService.findAllByInnovator(
      innovatorRequestUser,
      { name: innovation.name }
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
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find all innovations by q. accessor when findAllByAccessorAndSupportStatus() with status UNASSIGNED", async () => {
    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qAccessorRequestUser,
      InnovationSupportStatus.UNASSIGNED,
      false,
      false,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find NO innovations by q. accessor when findAllByAccessorAndSupportStatus() with status UNASSIGNED and Suggested to my organisation unit true", async () => {
    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qAccessorRequestUser,
      InnovationSupportStatus.UNASSIGNED,
      false,
      true,
      0,
      10
    );

    expect(result.data.length).toEqual(0);
    expect(result.count).toEqual(0);
  });

  it("should find ALL innovations by q. accessor when findAllByAccessorAndSupportStatus() with status UNASSIGNED and Suggested to my organisation unit true", async () => {
    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);

    const dummy = {
      assessment: {
        description: "Assessment Desc",
      },
    };

    const assessmentObj = {
      ...dummy.assessment,
      innovation: innovationA.id,
      assignTo: assessmentRequestUser.id,
    };

    const assessment = await assessmentService.create(
      assessmentRequestUser,
      innovationA.id,
      assessmentObj
    );

    const updAssessment = {
      maturityLevel: MaturityLevelCatalogue.ADVANCED,
      isSubmission: true,
      test: "test",
      organisationUnits: [
        qAccessorRequestUser.organisationUnitUser.organisationUnit.id,
      ],
    };

    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");

    jest.spyOn(notificationService, "create");

    await assessmentService.update(
      assessmentRequestUser,
      assessment.id,
      innovationA.id,
      updAssessment
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qAccessorRequestUser,
      InnovationSupportStatus.UNASSIGNED,
      false,
      true,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find all innovations by q. accessor when findAllByAccessorAndSupportStatus() with status ENGAGING and assignedToMe", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Q Accessor A",
    });
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovationA,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      qAccessorRequestUser,
      InnovationSupportStatus.ENGAGING,
      true,
      false,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find all innovations by accessor when findAllByAccessorAndSupportStatus() without assignedToMe", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Q Accessor A",
    });
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovationA,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      accessorRequestUser,
      InnovationSupportStatus.ENGAGING,
      false,
      false,
      0,
      10
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("should find all innovations by accessor when findAllByAccessorAndSupportStatus() with assignedToMe", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: "Q Accessor A",
    });
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      { id: accessorRequestUser.id, displayName: ":ACCESSOR" },
      { id: qAccessorRequestUser.id, displayName: ":QUALIFYING_ACCESSOR" },
    ]);

    const innovationA = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      organisationShares: [{ id: accessorOrganisation.id }],
      status: InnovationStatus.IN_PROGRESS,
    });

    const innovationB = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });

    await fixtures.saveInnovations(innovationA, innovationB);
    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovationA,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.findAllByAccessorAndSupportStatus(
      accessorRequestUser,
      InnovationSupportStatus.ENGAGING,
      true,
      false,
      0,
      10
    );

    expect(result.data.length).toEqual(0);
    expect(result.count).toEqual(0);
  });

  it("should throw an error when findAllByAccessor() with invalid params", async () => {
    let err;
    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        undefined,
        null,
        null,
        null,
        null,
        null
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should return empty when findAllByAccessor() with a user without organisations", async () => {
    let err;
    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        {
          id: ":user_id",
          externalId: ":user_id",
          type: UserType.ACCESSOR,
        },
        null,
        null,
        null,
        null,
        null
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
  });

  it("should throw an error when findAllByAccessor() with user with invalid role", async () => {
    let err;

    try {
      await innovationService.findAllByAccessorAndSupportStatus(
        {
          id: ":user_id",
          externalId: ":user_id",
          type: UserType.ACCESSOR,
          organisationUser: {
            id: ":organisation_user_id",
            role: InnovatorOrganisationRole.INNOVATOR_OWNER,
            organisation: {
              id: ":organisation_id",
              name: ":organisation_name",
            },
          },
        },
        InnovationSupportStatus.ENGAGING,
        false,
        false,
        0,
        10
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserRoleError);
  });

  it("should find the innovation by innovator Id and innovation Id when getInnovationOverview()", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const result = await innovationService.getInnovationOverview(
      innovatorRequestUser,
      innovation.id
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(innovation.id);
  });

  it("should throw an error when getInnovationOverview() without id", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(innovatorRequestUser, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when getInnovationOverview() without innovatorId", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(null, "id");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find the innovation with QUALIFYING_ACCESSOR and return an innovation summary", async () => {
    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":display_name",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });
    jest.spyOn(userService, "getProfile").mockResolvedValue({
      id: fakeInnovations[0].id,
      displayName: ":displayName",
    } as any);

    const result = await innovationService.getAccessorInnovationSummary(
      qAccessorRequestUser,
      fakeInnovations[0].id
    );

    expect(result).toBeDefined();
  });

  it("should find the innovation with NEEDS_ASSESSMENT and return an assessment innovation summary", async () => {
    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":display_name",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "test_user@example.com",
        },
      ],
      mobilePhone: "+351960000000",
    });

    jest.spyOn(userService, "getProfile").mockResolvedValue({
      id: fakeInnovations[0].id,
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
    } as any);

    const result = await innovationService.getAssessmentInnovationSummary(
      assessmentRequestUser,
      fakeInnovations[0].id
    );

    expect(result).toBeDefined();
  });

  it("should list innovations within the list of statuses", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
      })
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
    expect(result.data.length).toBe(1);
    expect(result.data[0].assessment.assignTo).toEqual({
      name: "assessement_user_name",
    });
  });

  it("should list innovations within the list of statuses getNotificationsGroupedBySupportStatus", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
      })
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments
          .map((a) => {
            return a.assignTo;
          })
          .join(),
        displayName: "assessement_user_name",
      }))
    );

    // jest.spyOn(axios, "get").mockResolvedValue({
    //   data: {
    //     value: [
    //       {
    //         id: assessmentUser.externalId,
    //         displayName: "assessment_user_name",
    //         accountEnabled: true,
    //       },
    //     ],
    //   },
    // });

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        innovatorRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
    expect(result.data.length).toBe(1);
    expect(result.data[0].assessment.assignTo).toEqual({
      name: "assessement_user_name",
    });
  });

  it("should submit the innovation by innovator Id and innovation Id", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      surveyId: "abc",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    jest
      .spyOn(innovationService, "hasIncompleteSections")
      .mockResolvedValue(false);

    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");

    await innovationService.submitInnovation(
      innovatorRequestUser,
      innovation.id
    );

    const result = await innovationService.getInnovationOverview(
      innovatorRequestUser,
      innovation.id
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(innovation.id);
  });

  it("should throw an error when submitInnovation() without id", async () => {
    let err;
    jest
      .spyOn(innovationService, "hasIncompleteSections")
      .mockResolvedValue(false);

    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");

    try {
      await innovationService.submitInnovation(undefined, "id");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when submitInnovation() with innovation not found", async () => {
    jest
      .spyOn(innovationService, "hasIncompleteSections")
      .mockResolvedValue(false);

    jest.spyOn(NotificationService.prototype, "sendEmail").mockResolvedValue();

    let err;
    try {
      await innovationService.submitInnovation(
        innovatorRequestUser,
        "62e5c505-afe4-47be-9b46-0f0b79dca954"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw an error when submitInnovation() with incomplete sections", async () => {
    jest
      .spyOn(innovationService, "hasIncompleteSections")
      .mockResolvedValue(true as any);

    jest.spyOn(NotificationService.prototype, "sendEmail").mockResolvedValue();
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      surveyId: "abc",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    let err;
    try {
      await innovationService.submitInnovation(
        innovatorRequestUser,
        innovation.id
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidSectionStateError);
  });

  it("should not list ASSESSMENT innovations with status CREATED", async () => {
    const innovator = await fixtures.createInnovatorUser();
    await fixtures.saveInnovations(
      fixtures.generateInnovation({ owner: innovator }),
      fixtures.generateInnovation({ owner: innovator })
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([]);

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(0);
  });

  it("should list ASSESSMENT innovations with status NEEDS_ASSESSMENT and without supports and assessments", async () => {
    const innovator = await fixtures.createInnovatorUser();
    await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: innovator,
        status: InnovationStatus.NEEDS_ASSESSMENT,
      }),
      fixtures.generateInnovation({ owner: innovator })
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([]);

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
  });

  it("should throw an error when getOrganisationShares() with invalid params", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(undefined, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find the innovation organisation shares", async () => {
    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      fakeInnovation,
      qAccessorRequestUser.organisationUnitUser.id
    );

    const result = await innovationService.getOrganisationShares(
      innovatorRequestUser,
      fakeInnovation.id
    );

    expect(result).toBeDefined();
    expect(result[0].status).toEqual(InnovationSupportStatus.ENGAGING);
  });

  it("should throw an error when updateOrganisationShares() with invalid params", async () => {
    let err;
    try {
      await innovationService.updateOrganisationShares(undefined, null, []);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when updateOrganisationShares() without organisations", async () => {
    let err;
    try {
      await innovationService.updateOrganisationShares(
        innovatorRequestUser,
        "b",
        []
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should update the innovation organisation shares", async () => {
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue([
      {
        id: ":accessor_user_id_1",
        displayName: "Accessor 1",
        identities: [
          {
            signInType: "emailAddress",
            issuerAssignedId: "email@email.com",
          },
        ],
      },
    ]);

    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      fakeInnovation,
      qAccessorRequestUser.organisationUnitUser.id
    );

    await fixtures.createInnovationAction(qAccessorRequestUser, fakeInnovation);

    const org = await fixtures.createOrganisation(OrganisationType.ACCESSOR);

    await innovationService.updateOrganisationShares(
      innovatorRequestUser,
      fakeInnovation.id,
      [org.id]
    );

    const search = await innovationService.getOrganisationShares(
      innovatorRequestUser,
      fakeInnovation.id
    );

    expect(search).toBeDefined();
    expect(search[0].status).toEqual(InnovationSupportStatus.UNASSIGNED);
  });

  it("should archive the innovation by innovator Id and innovation Id", async () => {
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      surveyId: "abc",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const result = await innovationService.archiveInnovation(
      innovatorRequestUser,
      innovation.id,
      ":reason"
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(innovation.id);
    expect(result.status).toBe(InnovationStatus.ARCHIVED);
  });

  it("should throw an error when archiveInnovation() without id", async () => {
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");
    let err;
    try {
      await innovationService.archiveInnovation(undefined, "id", "");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when archiveInnovation() with innovation not found", async () => {
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockRejectedValue("error");
    let err;
    try {
      await innovationService.archiveInnovation(
        innovatorRequestUser,
        "62e5c505-afe4-47be-9b46-0f0b79dca954",
        "reason"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should find the innovation organisation Unit shares", async () => {
    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    const requestUser: RequestUser = {
      id: ":requestUser",
      externalId: ":requestUser",
      type: UserType.ASSESSMENT,
    };

    const result = await innovationService.getOrganisationUnitShares(
      requestUser,
      fakeInnovation.id
    );

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should throw an error when createInnovation() with invalid params", async () => {
    let err;
    try {
      await innovationService.createInnovation(undefined, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when createInnovation() with invalid user type", async () => {
    let err;
    try {
      await innovationService.createInnovation(
        { id: ":id", externalId: ":id", type: UserType.ACCESSOR },
        {
          name: ":innovation_name",
          description: ":innovation_desc",
          countryName: "England",
          organisationShares: [],
        }
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserTypeError);
  });

  it("should create a new innovation", async () => {
    const result = await innovationService.createInnovation(
      innovatorRequestUser,
      {
        name: ":innovation_name",
        description: ":innovation_desc",
        countryName: "England",
        organisationShares: [accessorOrganisation.id],
      }
    );

    expect(result).toBeDefined();
    expect(result.name).toBe(":innovation_name");
    expect(result.status).toBe(InnovationStatus.CREATED);
  });

  it("should list innovations WITH COUNT 1 within the list of statuses IF UNASSIGNED", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
      })
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10,
        [],
        SupportFilter.UNASSIGNED
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
  });

  it("should list innovations WITH COUNT 0 within the list of statuses IF NOT UNASSIGNED", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
      })
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10,
        [],
        SupportFilter.ENGAGING
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(0);
  });

  it("should list innovations WITH COUNT 1 within the list of statuses IF ENGAGING SUPPORT EXISTS", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );
    const supportObj = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovations[0].id,
      supportObj
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10,
        [],
        SupportFilter.ENGAGING
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
  });

  it("should list innovations WITH COUNT 0 within the list of statuses IF SUPPORT OTHER THAN ENGAGING EXISTS", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );
    const supportObj = {
      status: InnovationSupportStatus.NOT_YET,
      accessors: [],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovations[0].id,
      supportObj
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10,
        [],
        SupportFilter.ENGAGING
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(0);
  });

  it("should list innovations WITH COUNT 0 within the list of statuses IF ENGAGING AND OTHER SUPPORT EXISTS", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        organisationShares: [
          { id: accessorOrganisation.id },
          { id: accessorOrganisation2.id },
        ],
      })
    );
    const supportObj = {
      status: InnovationSupportStatus.NOT_YET,
      accessors: [],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovations[0].id,
      supportObj
    );

    const supportObj2 = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [],
    };

    const support2 = await supportService.create(
      qAccessorRequestUser2,
      innovations[0].id,
      supportObj2
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments.map((a) => a.assignTo).join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10,
        [],
        SupportFilter.NOT_ENGAGING
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(0);
  });

  it("should list innovations WITH COUNT 1 within the list of statuses IF ENGAGING AND OTHER SUPPORT EXISTS", async () => {
    const innovations: Innovation[] = await fixtures.saveInnovationsWithAssessment(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        organisationShares: [
          { id: accessorOrganisation.id },
          { id: accessorOrganisation2.id },
        ],
      })
    );
    const supportObj = {
      status: InnovationSupportStatus.NOT_YET,
      accessors: [],
    };

    const support = await supportService.create(
      qAccessorRequestUser,
      innovations[0].id,
      supportObj
    );

    const supportObj2 = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [],
    };

    const support2 = await supportService.create(
      qAccessorRequestUser2,
      innovations[0].id,
      supportObj2
    );

    jest.spyOn(helpers, "authenticateWitGraphAPI").mockImplementation();
    jest.spyOn(helpers, "getUsersFromB2C").mockResolvedValue(
      innovations.map((inno) => ({
        id: inno.assessments
          .map((a) => {
            return a.assignTo;
          })
          .join(),
        displayName: "assessement_user_name",
      }))
    );

    let result: InnovationListModel;
    try {
      result = await innovationService.getInnovationListByState(
        assessmentRequestUser,
        [InnovationStatus.NEEDS_ASSESSMENT],
        0,
        10,
        [],
        SupportFilter.ENGAGING
      );
    } catch (error) {
      throw error;
    }

    expect(result.count).toBe(1);
  });

  it("should throw when organisations is null in updateOrganisationShares()", async () => {
    const fakeInnovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );
    let err;
    try {
      await innovationService.updateOrganisationShares(
        innovatorRequestUser,
        fakeInnovation.id,
        []
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when findInnovation() with invalid params", async () => {
    let err;
    try {
      await innovationService.findInnovation(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when findInnovation() with invalid user role", async () => {
    let err;
    const requestUser = {
      id: "request_user_id",
      externalId: "request_user_id",
      type: UserType.ADMIN,
    };

    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    try {
      await innovationService.findInnovation(
        requestUser,
        fakeInnovations[0].id
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserRoleError);
  });
  it("should throw when getAssessmentInnovationSummary() with invalid params", async () => {
    let err;
    try {
      await innovationService.getAssessmentInnovationSummary(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when getAccessorInnovationSummary() with invalid params", async () => {
    let err;
    try {
      await innovationService.getAccessorInnovationSummary(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when getAccessorInnovationSummary() with MissingUserOrganisation ", async () => {
    let err;

    const fakeInnovations = await fixtures.saveInnovations(
      fixtures.generateInnovation({
        owner: { id: innovatorRequestUser.id },
        status: InnovationStatus.IN_PROGRESS,
        organisationShares: [{ id: accessorOrganisation.id }],
      })
    );

    try {
      await innovationService.getAccessorInnovationSummary(
        {
          id: ":id",
          externalId: ":id",
          type: UserType.ACCESSOR,
        },
        fakeInnovations[0].id
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("Should find records when user is of type Accessor and all matching arguments", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "England",
      mainCategory: "MEDICAL_DEVICES",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const result = await innovationService.findAllAdvanced(
      setup.users.qualifyingAccessor,
      "",
      false,
      false,
      ["MEDICAL_DEVICES"],
      ["England", "Scotland"],
      [setup.accessorOrganisation.id],
      ["ENGAGING", "NOT_YET"],
      0,
      1000
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("Should throw error when request user does not have an accessor role", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "England",
      mainCategory: "MEDICAL_DEVICES",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const innovatorUser = await fixtures.createAssessmentUser();

    const org = await fixtures.createOrganisation(OrganisationType.ACCESSOR);
    const orgUser = await fixtures.addUserToOrganisation(
      innovatorUser,
      org,
      InnovatorOrganisationRole.INNOVATOR_OWNER
    );
    const innovatorRequestUser = fixtures.getRequestUser(
      innovatorUser,
      orgUser
    );

    let err;

    try {
      await innovationService.findAllAdvanced(
        innovatorRequestUser,
        "",
        false,
        false,
        ["MEDICAL_DEVICES"],
        ["England", "Scotland"],
        [setup.accessorOrganisation.id],
        ["ENGAGING", "NOT_YET"],
        0,
        1000
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserRoleError);
  });

  it("Should throw error when request user does not have an org", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "England",
      mainCategory: "MEDICAL_DEVICES",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const assessmentUser = await fixtures.createAssessmentUser();
    const assessmentRequestUser = fixtures.getRequestUser(assessmentUser);
    let err;

    try {
      await innovationService.findAllAdvanced(
        assessmentRequestUser,
        "",
        false,
        false,
        ["MEDICAL_DEVICES"],
        ["England", "Scotland"],
        [setup.accessorOrganisation.id],
        ["ENGAGING", "NOT_YET"],
        0,
        1000
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(MissingUserOrganisationError);
  });

  it("Should throw error when request user is invaild", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "England",
      mainCategory: "MEDICAL_DEVICES",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const assessmentUser = await fixtures.createAssessmentUser();
    const assessmentRequestUser = fixtures.getRequestUser(assessmentUser);
    let err;

    try {
      await innovationService.findAllAdvanced(
        null,
        "",
        false,
        false,
        ["MEDICAL_DEVICES"],
        ["England", "Scotland"],
        [setup.accessorOrganisation.id],
        ["ENGAGING", "NOT_YET"],
        0,
        1000
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw error getOrganisationUnitShares() with invalid parameter", async () => {
    let err;
    try {
      await innovationService.getOrganisationUnitShares(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw error getOrganisationUnitShares() when innovation not found", async () => {
    let err;
    try {
      await innovationService.getOrganisationUnitShares(
        innovatorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw an error when getInnovationOverview() innovation id not present", async () => {
    let err;
    try {
      await innovationService.getInnovationOverview(
        innovatorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw an error when getOrganisationShares() with invalid params", async () => {
    let err;
    try {
      await innovationService.getOrganisationShares(undefined, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw an error when getOrganisationShares() with invalid params", async () => {
    let err;
    try {
      await innovationService.getOrganisationShares(
        accessorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw when getAccessorInnovationSummary() with InnovationNotFoundError", async () => {
    let err;
    try {
      await innovationService.getAccessorInnovationSummary(
        accessorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });
});
