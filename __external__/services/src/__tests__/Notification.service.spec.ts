/**
 * @jest-environment node
 */
/* tslint:disable */
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import {
  NotifContextDetail,
  NotifContextPayloadType,
  NotifContextType,
} from "@domain/enums/notification.enums";
import {
  AccessorOrganisationRole,
  Comment,
  Innovation,
  InnovationAction,
  InnovationAssessment,
  InnovationSection,
  InnovationSupport,
  InnovationSupportLog,
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
  NotificationPreference,
  ActivityLog,
  UserRole,
  NotificationPreferenceType,
} from "@domain/index";
import * as engines from "@engines/index";
import { InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { InAppNotificationService } from "@services/services/InAppNotification.service";
import { LoggerService } from "@services/services/Logger.service";
import { UserService } from "@services/services/User.service";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { PaginationQueryParamsType } from "utils/joi.helper";
import {
  closeTestsConnection,
  InnovationSupportService,
  setupTestsConnection,
} from "..";
import * as insights from "../../../../utils/logging/insights";
import * as helpers from "../helpers";
import { NotificationService } from "../services/Notification.service";
import * as fixtures from "../__fixtures__";

describe("Notification Service Suite", () => {
  let notificationService: NotificationService;
  let inAppNotificationService: InAppNotificationService;
  let supportService: InnovationSupportService;

  beforeAll(async () => {
    //await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    notificationService = new NotificationService(process.env.DB_TESTS_NAME);
    supportService = new InnovationSupportService(process.env.DB_TESTS_NAME);
    inAppNotificationService = new InAppNotificationService(
      process.env.DB_TESTS_NAME
    );

    jest.spyOn(insights, "getInstance").mockReturnValue({
      default: {
        trackTrace: () => {
          return;
        },
      },
    } as any);

    jest.spyOn(LoggerService.prototype, "error").mockImplementation();
    jest.spyOn(LoggerService.prototype, "log").mockImplementation();

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
    //closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(InnovationSupportLog).execute();
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
    await query.from(NotificationPreference).execute();
    await query.from(UserRole).execute();
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,
      innovation.id
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(innovator.id.toLocaleUpperCase());
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
        externalId: qaccessor.id,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      aUnitUser.id
    );

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,
      innovation.id
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(accessor.id.toUpperCase());
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

    await fixtures.createSupportInInnovationMultipleAccessors(
      {
        id: qaccessor.id,
        externalId: qaccessor.externalId,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      [aUnitUser1.id, aUnitUser2.id]
    );

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,
      innovation.id
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
        externalId: qaccessor.id,
        type: UserType.ACCESSOR,
        organisationUser: qOrgUser,
        organisationUnitUser: qUnitUser,
      },
      innovation,
      aUnitUser2.id
    );

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ACCESSORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,
      innovation.id
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toBe(accessor2.id.toUpperCase());
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
      {
        id: assessmentUser.id,
        externalId: assessmentUser.id,
        type: UserType.ASSESSMENT,
      },
      innovation
    );

    const requestUser: RequestUser = {
      id: assessmentUser.id,
      externalId: assessmentUser.id,
      type: UserType.ASSESSMENT,
    };

    await fixtures.addSuggestionsToAssessment(
      requestUser,
      assessment.id,
      innovation.id,
      [unit]
    );

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.QUALIFYING_ACCESSORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
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
      {
        id: assessmentUser.id,
        externalId: assessmentUser.id,
        type: UserType.ASSESSMENT,
      },
      innovation
    );

    const requestUser: RequestUser = {
      id: assessmentUser.id,
      externalId: assessmentUser.id,
      type: UserType.ASSESSMENT,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.QUALIFYING_ACCESSORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
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
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification = await notificationService.create(
      requestUser,
      NotificationAudience.ASSESSMENT_USERS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
    );

    const notificationUsers = await notification.notificationUsers;

    expect(notification).toBeDefined();
    expect(notificationUsers.length).toBe(1);
    expect(notificationUsers[0].user).toEqual(
      assessmentUser.id.toLocaleUpperCase()
    );
  });

  it("should throw error when dismiss with invalid contextId", async () => {
    const dismisssRequestUser: RequestUser = {
      id: ":innovatorId",
      externalId: ":innovatorId",
      type: UserType.INNOVATOR,
    };

    const notificationContext: NotifContextPayloadType = {
      id: ":contextId",
      type: NotifContextType.INNOVATION,
    };

    let error: Error;
    try {
      await inAppNotificationService.dismiss(
        dismisssRequestUser,
        null,
        null,
        notificationContext
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(InvalidParamsError);
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation.id
    );

    const dismisssRequestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notificationContext: NotifContextPayloadType = {
      id: innovation.id,
      type: NotifContextType.INNOVATION,
    };

    const actual = await inAppNotificationService.dismiss(
      dismisssRequestUser,
      null,
      null,
      notificationContext
    );

    expect(actual.affected).toBe(1);
  });

  it("should delete a notification", async () => {
    const innovator = await fixtures.createInnovatorUser();

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const deleteRequestUser: RequestUser = innovator;

    const actual = await inAppNotificationService.deleteNotification(
      deleteRequestUser,
      notification1.id
    );

    expect(actual.id).toBe(notification1.id);
    expect(actual.status).toBe("DELETED");
  });

  it("should get notification by innovation id", async () => {
    const innovator = await fixtures.createInnovatorUser();

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const actual = await inAppNotificationService.getNotificationsByInnovationId(
      innovator,
      innovation.id
    );

    expect(actual.count).toBe(1);
  });

  it("should get notification counters by user id", async () => {
    const innovator = await fixtures.createInnovatorUser();

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );
    await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const actual = await inAppNotificationService.getNotificationCountersByUserId(
      innovator
    );

    expect(actual.total).toBe(2);
  });

  it("should get notifications by user id", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");

    jest.spyOn(UserService.prototype, "getUsersList").mockResolvedValue([
      {
        id: "id",
        externalId: "externalId",
        displayName: "displayName",
        email: "email",
      },
    ]);

    const innovator = await fixtures.createInnovatorUser();

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovator.id },
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );
    await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const filters: { [key: string]: any } = {
      contexTypes: [],
    };

    const paginationObj: PaginationQueryParamsType<string> = {
      order: {
        createdAt: "DESC",
      },
      skip: 0,
      take: 20,
    };

    const actual = await inAppNotificationService.getNotificationsByUserId(
      innovator,
      filters,
      paginationObj
    );

    expect(actual.count).toBe(2);
  });

  it("should fail with sql injection test", async () => {
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    let error: Error;
    try {
      await notificationService.getAllUnreadNotificationsCounts(
        innovatorUser,
        innovation.id + " or 1 = 1"
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation.id
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getAllUnreadNotificationsCounts(
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation.id
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getAllUnreadNotificationsCounts(
      innovatorUser,
      innovation.id
    );

    expect(actual).toBeDefined();
    expect(actual.ACTION).toEqual(1);
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation.id
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation.id
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    const actual = await notificationService.getAllUnreadNotificationsCounts(
      innovatorUser,
      innovation.id
    );

    expect(actual).toBeDefined();
    expect(actual).toEqual({ COMMENT: 2, ACTION: 1, INNOVATION: 1 });
  });

  it("should throw error when getUnreadNotifications with invalid innovationId", async () => {
    const requestUser: RequestUser = {
      id: ":innovatorId",
      externalId: ":innovatorId",
      type: UserType.INNOVATOR,
    };

    let error: Error;
    try {
      await notificationService.getUnreadNotifications(requestUser, "abc");
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(InvalidParamsError);
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
      externalId: accessor.id,
      type: UserType.ACCESSOR,
    };

    const notification1 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification2 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.INNOVATION,
      NotifContextDetail.INNOVATION_SUBMISSION,

      innovation.id
    );

    const notification3 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation.id
    );

    const notification4 = await notificationService.create(
      requestUser,
      NotificationAudience.INNOVATORS,
      innovation.id,
      NotifContextType.ACTION,
      NotifContextDetail.ACTION_CREATION,

      innovation.id
    );

    const innovatorUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
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
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: ":accessor_user_id_1",
      displayName: "Accessor 1",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "email@email.com",
        },
      ],
    });

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
      NotifContextType.COMMENT,
      NotifContextDetail.COMMENT_CREATION,

      innovation1.id
    );
    const notificationByStatus = await notificationService.getNotificationsGroupedBySupportStatus(
      accessorRequestUser
    );

    expect(notificationByStatus).toBeDefined();
    expect(Object.keys(notificationByStatus).length).toBe(2);
    expect(Object.keys(notificationByStatus).includes("UNASSIGNED")).toBe(true);
    expect(Object.keys(notificationByStatus).includes("ENGAGING")).toBe(true);
  });

  /*it("should throw error when dismiss with invalid contextId", async () => {
    const dismisssRequestUser: RequestUser = {
      id: ":innovatorId",
      externalId: ":innovatorId",
      type: UserType.INNOVATOR,
    };

    let error: Error;
    try {
      await notificationService.dismiss(
        dismisssRequestUser,
        NotificationContextType.INNOVATION,
        "abc"
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(InvalidParamsError);
  });*/

  it("should get email notification preferences", async () => {
    const innovator = await fixtures.createInnovatorUser();

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    await notificationService.updateEmailNotificationPreferences(requestUser, [
      {
        notificationType: NotificationContextType.ACTION,
        preference: NotificationPreferenceType.NEVER,
      },
    ]);

    const notificationPreferences = await notificationService.getEmailNotificationPreferences(
      requestUser
    );

    expect(notificationPreferences).toBeDefined();
    expect(notificationPreferences[0].notificationType).toBeDefined();
    expect(
      notificationPreferences[0].preference.includes(
        NotificationPreferenceType.NEVER
      )
    ).toBe(true);
  });

  it("should update email notification preferences", async () => {
    const innovator = await fixtures.createInnovatorUser();

    const requestUser: RequestUser = {
      id: innovator.id,
      externalId: innovator.id,
      type: UserType.INNOVATOR,
    };

    await notificationService.updateEmailNotificationPreferences(requestUser, [
      {
        notificationType: NotificationContextType.ACTION,
        preference: NotificationPreferenceType.NEVER,
      },
    ]);

    const updateResult = await notificationService.updateEmailNotificationPreferences(
      requestUser,
      [
        {
          notificationType: NotificationContextType.ACTION,
          preference: NotificationPreferenceType.DAILY,
        },
      ]
    );

    expect(updateResult).toBeDefined();
    expect(updateResult[0].notificationType).toBeDefined();
    expect(updateResult[0].status).toBeDefined();
  });
});
