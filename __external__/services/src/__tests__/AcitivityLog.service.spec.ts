import { Activity, ActivityLog, ActivityType, Innovation } from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import { RequestUser } from "@services/models/RequestUser";
import { ActivityLogService } from "@services/services/ActivityLog.service";

import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection, UserService } from "..";
import * as fixtures from "../__fixtures__";

describe("ActivityLog Service Suite", () => {
  let activityLogService: ActivityLogService;
  let innovatorRequestUser: RequestUser;
  let innovation: Innovation;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    activityLogService = new ActivityLogService(process.env.DB_TESTS_NAME);

    const innovatorUser = await fixtures.createInnovatorUser();

    innovation = await fixtures.saveInnovation(
      fixtures.generateInnovation({
        owner: innovatorUser,
        surveyId: "abc",
        organisationShares: [],
      })
    );

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);
  });

  afterAll(async () => {
    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(ActivityLog).execute();
    await query.from(Innovation).execute();
  });

  it("should get activities for an innovation()", async () => {
    // Arrange
    jest.spyOn(UserService.prototype, "getListOfUsers").mockResolvedValue([
      {
        id: "abc",
        displayName: "Action User",
      },
      {
        id: "xyz",
        displayName: "Intervening User",
      },
    ] as ProfileSlimModel[]);

    const activityLog = ActivityLog.new({
      type: ActivityType.INNOVATION_MANAGEMENT,
      activity: Activity.OWNERSHIP_TRANSFER,
      param: `{"actionUserId":"abc","interveningUserId":"xyz"}`,
      innovation: {
        id: innovation.id,
      },
    });

    const log = await activityLogService.create(activityLog);

    // Act
    const result = await activityLogService.getInnovationActivitiesById(
      innovatorRequestUser,
      innovation,
      10,
      0,
      "INNOVATION_MANAGEMENT"
    );

    // Assert
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.count).toEqual(1);
  });

  it("should get count 0 when no activities for an innovation()", async () => {
    const result = await activityLogService.getInnovationActivitiesById(
      innovatorRequestUser,
      innovation,
      10,
      0,
      ""
    );

    expect(result.data.length).toEqual(0);
    expect(result.count).toEqual(0);
  });

  it("should throw error when innovation is null in getInnovationActivitiesById()", async () => {
    let err;
    try {
      await activityLogService.getInnovationActivitiesById(
        innovatorRequestUser,
        null,
        10,
        0,
        ""
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw error when innovation is null in createLog()", async () => {
    let err;
    try {
      await activityLogService.createLog(
        innovatorRequestUser,
        null,
        Activity.ACTION_CREATION,
        null
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });
});
