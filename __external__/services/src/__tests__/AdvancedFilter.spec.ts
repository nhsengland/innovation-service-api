import { InnovationService } from "@services/services/Innovation.service";
import { NotificationService } from "@services/services/Notification.service";
import { getConnection } from "typeorm";
import {
  closeTestsConnection,
  Innovation,
  Comment,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationSupport,
  InnovationSupportLog,
  NotificationUser,
  Organisation,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  setupTestsConnection,
  User,
  Notification,
} from "..";
import * as fixtures from "../__fixtures__";
import * as dotenv from "dotenv";
import * as path from "path";
import {
  ActivityLog,
  InnovatorOrganisationRole,
  OrganisationType,
} from "@domain/index";
import {
  InvalidUserRoleError,
  MissingUserOrganisationError,
} from "@services/errors";

describe("Advanced filter suite", () => {
  let innovationService: InnovationService;
  let notificationService: NotificationService;

  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });

    notificationService = new NotificationService(process.env.DB_TESTS_NAME);
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(InnovationSupportLog).execute();
    await query.from(InnovationSupport).execute();
    await query.from(Comment).execute();
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();

    await query.from(InnovationAssessment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();
  });

  afterAll(async () => {
    //await closeTestsConnection();
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

  it("Should not find records with inexistent category", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "Portugal",
      mainCategory: "PHARMACEUTICAL",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const result = await innovationService.findAllAdvanced(
      setup.users.qualifyingAccessor,
      "",
      false,
      false,
      ["MEDICAL_DEVICES"],
      ["Portugal"],
      [setup.accessorOrganisation.id],
      ["ENGAGING", "NOT_YET"],
      0,
      1000
    );

    expect(result.data.length).toEqual(0);
    expect(result.count).toEqual(0);
  });

  it("Should find records with other locations (based outside uk)", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "Portugal",
      mainCategory: "PHARMACEUTICAL",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const result = await innovationService.findAllAdvanced(
      setup.users.qualifyingAccessor,
      "",
      false,
      false,
      ["PHARMACEUTICAL"],
      ["based outside uk"],
      [setup.accessorOrganisation.id],
      ["ENGAGING", "NOT_YET"],
      0,
      1000
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
  });

  it("Should find records with other locations (based outside uk) or England", async () => {
    jest.spyOn(notificationService, "sendEmail");
    jest.spyOn(notificationService, "create");

    const innovation = {
      countryName: "Portugal",
      mainCategory: "PHARMACEUTICAL",
    };

    const setup = await fixtures.setupCompleteInnovation(true, innovation);

    const result = await innovationService.findAllAdvanced(
      setup.users.qualifyingAccessor,
      "",
      false,
      false,
      ["PHARMACEUTICAL"],
      ["based outside uk", "England"],
      [setup.accessorOrganisation.id],
      ["ENGAGING", "NOT_YET"],
      0,
      1000
    );

    expect(result.data.length).toEqual(1);
    expect(result.count).toEqual(1);
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
});
