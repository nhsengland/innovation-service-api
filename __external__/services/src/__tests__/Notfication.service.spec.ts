/**
 * @jest-environment node
 */
import {
  Innovation,
  InnovationAssessment,
  InnovationSupport,
  Notification,
  NotificationAudience,
  NotificationContextType,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import { NotificationService } from "../services/Notification.service";
import * as fixtures from "../__fixtures__";

describe("Notification Service Suite", () => {
  let notificationService: NotificationService;
  beforeAll(async () => {
    //await setupTestsConnection();
    notificationService = new NotificationService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(InnovationSupport).execute();
    await query.from(InnovationAssessment).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();
  });

  it("should instantiate the User service", async () => {
    expect(notificationService).toBeDefined();
  });

  it("should create a notification to an innovator", async () => {
    const accessor = await fixtures.createAccessorUser();
    const innovator = await fixtures.createInnovatorUser();
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const orgUser = await fixtures.addUserToOrganisation(
      accessor,
      organisation,
      "ACCESSOR"
    );
    const unit = await fixtures.createOrganisationUnit(organisation);
    await fixtures.addOrganisationUserToOrganisationUnit(orgUser, unit);
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const requestUser: RequestUser = {
      id: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(innovator.id);
  });

  it("should create a notification to an accessor", async () => {
    const qaccessor = await fixtures.createAccessorUser();
    const accessor = await fixtures.createAccessorUser();

    const innovator = await fixtures.createInnovatorUser();
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const qOrgUser = await fixtures.addUserToOrganisation(
      qaccessor,
      organisation,
      "QUALIFYING_ACCESSOR"
    );
    const aOrgUser = await fixtures.addUserToOrganisation(
      accessor,
      organisation,
      "ACCESSOR"
    );

    const unit = await fixtures.createOrganisationUnit(organisation);
    const qUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      qOrgUser,
      unit
    );
    const aUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      aOrgUser,
      unit
    );

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
      organisationShares: [{ id: organisation.id }],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const support = await fixtures.createSupportInInnovation(
      {
        id: qaccessor.id,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      aUnitUser.id
    );

    const requestUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(accessor.id);
  });

  it("should create a notification for multiple accessors", async () => {
    const qaccessor = await fixtures.createAccessorUser();
    const accessor1 = await fixtures.createAccessorUser();
    const accessor2 = await fixtures.createAccessorUser();

    const innovator = await fixtures.createInnovatorUser();
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const qOrgUser = await fixtures.addUserToOrganisation(
      qaccessor,
      organisation,
      "QUALIFYING_ACCESSOR"
    );
    const aOrgUser1 = await fixtures.addUserToOrganisation(
      accessor1,
      organisation,
      "ACCESSOR"
    );
    const aOrgUser2 = await fixtures.addUserToOrganisation(
      accessor2,
      organisation,
      "ACCESSOR"
    );

    const unit = await fixtures.createOrganisationUnit(organisation);
    const qUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      qOrgUser,
      unit
    );
    const aUnitUser1 = await fixtures.addOrganisationUserToOrganisationUnit(
      aOrgUser1,
      unit
    );
    const aUnitUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      aOrgUser2,
      unit
    );

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
      organisationShares: [{ id: organisation.id }],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    await fixtures.createSupportInInnovation(
      {
        id: qaccessor.id,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      aUnitUser1.id
    );

    await fixtures.createSupportInInnovation(
      {
        id: qaccessor.id,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      aUnitUser2.id
    );

    const requestUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(2);
  });

  it("should create a notification for multiple accessors only supporting innovation", async () => {
    const qaccessor = await fixtures.createAccessorUser();
    const accessor1 = await fixtures.createAccessorUser();
    const accessor2 = await fixtures.createAccessorUser();

    const innovator = await fixtures.createInnovatorUser();
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );

    const qOrgUser = await fixtures.addUserToOrganisation(
      qaccessor,
      organisation,
      "QUALIFYING_ACCESSOR"
    );
    const aOrgUser1 = await fixtures.addUserToOrganisation(
      accessor1,
      organisation,
      "ACCESSOR"
    );
    const aOrgUser2 = await fixtures.addUserToOrganisation(
      accessor2,
      organisation,
      "ACCESSOR"
    );

    const unit = await fixtures.createOrganisationUnit(organisation);
    const qUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      qOrgUser,
      unit
    );
    const aUnitUser1 = await fixtures.addOrganisationUserToOrganisationUnit(
      aOrgUser1,
      unit
    );
    const aUnitUser2 = await fixtures.addOrganisationUserToOrganisationUnit(
      aOrgUser2,
      unit
    );

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
      organisationShares: [{ id: organisation.id }],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    await fixtures.createSupportInInnovation(
      {
        id: qaccessor.id,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      aUnitUser2.id
    );

    const requestUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toBe(accessor2.id);
  });

  it("should create a notification to a qualifying accessor", async () => {
    const qaccessor = await fixtures.createAccessorUser();

    const innovator = await fixtures.createInnovatorUser();
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const qOrgUser = await fixtures.addUserToOrganisation(
      qaccessor,
      organisation,
      "QUALIFYING_ACCESSOR"
    );

    const unit = await fixtures.createOrganisationUnit(organisation);
    await fixtures.addOrganisationUserToOrganisationUnit(qOrgUser, unit);

    const assessmentUser = await fixtures.createAssessmentUser();

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
      organisationShares: [{ id: organisation.id }],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const assessment = await fixtures.createAssessment(
      { id: assessmentUser.id, type: UserType.ASSESSMENT },
      innovation
    );

    const requestUser: RequestUser = {
      id: assessmentUser.id,
      type: UserType.ASSESSMENT,
    };

    await fixtures.addSharesToAssessment(
      requestUser,
      assessment.id,
      innovation.id,
      [organisation]
    );

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.QUALIFYING_ACCESSORS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(qaccessor.id);
  });

  it("should not create a notification to a qualifying accessor not in the organisation shares of an assessment", async () => {
    const qaccessor = await fixtures.createAccessorUser();

    const innovator = await fixtures.createInnovatorUser();
    const organisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const qOrgUser = await fixtures.addUserToOrganisation(
      qaccessor,
      organisation,
      "QUALIFYING_ACCESSOR"
    );

    const unit = await fixtures.createOrganisationUnit(organisation);
    await fixtures.addOrganisationUserToOrganisationUnit(qOrgUser, unit);

    const assessmentUser = await fixtures.createAssessmentUser();

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
      organisationShares: [{ id: organisation.id }],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const assessment = await fixtures.createAssessment(
      { id: assessmentUser.id, type: UserType.ASSESSMENT },
      innovation
    );

    const requestUser: RequestUser = {
      id: assessmentUser.id,
      type: UserType.ASSESSMENT,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.QUALIFYING_ACCESSORS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(0);
  });

  it("should create a notification to an assessment user", async () => {
    const innovator = await fixtures.createInnovatorUser();
    const assessmentUser = await fixtures.createAssessmentUser();
    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const requestUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ASSESSMENT_USERS,
      innovation.id,
      NotificationContextType.ACTION,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(assessmentUser.id);
  });
});
