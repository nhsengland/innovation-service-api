/**
 * @jest-environment node
 */
/* tslint:disable */
import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationSupport,
  InnovationSupportStatus,
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
import {
  closeTestsConnection,
  InnovationSupportService,
  setupTestsConnection,
} from "..";
import { NotificationService } from "../services/Notification.service";
import * as fixtures from "../__fixtures__";

describe("Notification Service Suite", () => {
  let notificationService: NotificationService;
  let supportService: InnovationSupportService;
  beforeAll(async () => {
    //await setupTestsConnection();
    notificationService = new NotificationService(process.env.DB_TESTS_NAME);
    supportService = new InnovationSupportService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(Comment).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
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
      innovation.id,
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
      innovation.id,
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

      innovation.id,
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

      innovation.id,
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
      [unit]
    );

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.QUALIFYING_ACCESSORS,
      innovation.id,
      NotificationContextType.ACTION,

      innovation.id,
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

      innovation.id,
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

      innovation.id,
      "teste"
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(assessmentUser.id);
  });

  it("should dismiss notification from an innovator with given context id and context type", async () => {
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

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 1"
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 2"
    );

    const dismisssRequestUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.dismiss(
      dismisssRequestUser,
      NotificationContextType.INNOVATION,
      innovation.id
    );

    expect(actual.affected).toBe(1);
  });

  it("should get all unread notifications counts", async () => {
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

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 1"
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 2"
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 3"
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.ACTION,

      innovation.id,
      "test 3"
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getUnreadNotificationsCounts(
      innovatorUser,
      innovation.id
    );

    expect(actual).toBeDefined();
    expect(actual).toEqual({ COMMENT: 1, ACTION: 1, INNOVATION: 2 });
  });

  it("should get unread ACTION notifications counts", async () => {
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

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 1"
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 2"
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 3"
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.ACTION,

      innovation.id,
      "test 3"
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getUnreadNotificationsCounts(
      innovatorUser,
      innovation.id,
      NotificationContextType.ACTION
    );

    expect(actual).toBeDefined();
    expect(actual).toEqual({ ACTION: 1 });
  });

  it("should get unread COMMENT notifications counts by contextId", async () => {
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

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 1"
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 2"
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 3"
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.ACTION,

      innovation.id,
      "test 3"
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getUnreadNotificationsCounts(
      innovatorUser,
      innovation.id,
      null,
      innovation.id
    );

    expect(actual).toBeDefined();
    expect(actual).toEqual({ COMMENT: 2, ACTION: 1, INNOVATION: 1 });
  });

  it("should get unread INNOVATION notifications counts by contextId and contextType INNOVATION", async () => {
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

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 1"
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 2"
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 3"
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.ACTION,

      innovation.id,
      "test 3"
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getUnreadNotificationsCounts(
      innovatorUser,
      innovation.id,
      NotificationContextType.INNOVATION,
      innovation.id
    );

    expect(actual).toBeDefined();
    expect(actual).toEqual({ INNOVATION: 1 });
  });

  it("should get unread ACTION notifications list", async () => {
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

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 1"
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.INNOVATION,

      innovation.id,
      "test 2"
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.COMMENT,

      innovation.id,
      "test 3"
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotificationContextType.ACTION,

      innovation.id,
      "test 3"
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getUnreadNotifications(
      innovatorUser,
      innovation.id,
      NotificationContextType.ACTION
    );

    expect(actual).toBeDefined();
    expect(actual.length).toBe(1);
    expect(actual[0].readAt).toBeNull();
  });

  it("should get aggregated unread Innovations count", async () => {
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

    const innovationObj1 = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    const innovationObj2 = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abce",
      organisationShares: [{ id: accessorOrganisation.id }],
    });

    const innovations = await fixtures.saveInnovations(
      innovationObj1,
      innovationObj2
    );

    const innovation1 = innovations[0];
    const innovation2 = innovations[1];

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

    const innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
    const qAccessorRequestUser = fixtures.getRequestUser(
      qualAccessorUser,
      organisationQAccessorUser,
      organisationUnitQAccessorUser
    );
    const accessorRequestUser = fixtures.getRequestUser(
      accessorUser,
      organisationAccessorUser,
      organisationUnitAccessorUser
    );

    let supportObj1 = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    let supportObj2 = {
      status: InnovationSupportStatus.COMPLETE,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    const support1 = await supportService.create(
      qAccessorRequestUser,
      innovation1.id,
      supportObj1
    );

    const support2 = await supportService.create(
      qAccessorRequestUser,
      innovation2.id,
      supportObj2
    );

    await fixtures.createInnovationAction(qAccessorRequestUser, innovation1);
    await fixtures.createInnovationAction(qAccessorRequestUser, innovation2);

    supportObj1 = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [
        accessorRequestUser.organisationUnitUser.id,
        qAccessorRequestUser.organisationUnitUser.id,
      ],
      comment: null,
    };

    supportObj2 = {
      status: InnovationSupportStatus.UNASSIGNED,
      accessors: [],
      comment: null,
    };

    await supportService.update(
      qAccessorRequestUser,
      support1.id,
      innovation1.id,
      supportObj1
    );

    await supportService.update(
      qAccessorRequestUser,
      support2.id,
      innovation2.id,
      supportObj2
    );

    const notification = await notificationService.create(
      innovatorRequestUser,
      NotificationAudience.ACCESSORS,
      innovation1.id,
      NotificationContextType.COMMENT,

      innovation1.id,
      "test 3"
    );
    const notificationByStatus = await notificationService.getAggregatedInnovationNotifications(
      accessorRequestUser
    );

    expect(notificationByStatus).toBeDefined();
    expect(Object.keys(notificationByStatus).length).toBe(2);
    expect(Object.keys(notificationByStatus).includes("UNASSIGNED")).toBe(true);
    expect(Object.keys(notificationByStatus).includes("ENGAGING")).toBe(true);
  });
});
