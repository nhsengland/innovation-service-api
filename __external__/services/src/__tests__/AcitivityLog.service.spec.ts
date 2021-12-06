import {
  Activity,
  ActivityLog,
  ActivityType,
  Innovation,
  InnovationSectionAliasCatalogue,
} from "@domain/index";
import { InvalidParamsError } from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { ActivityLogService } from "@services/services/ActivityLog.service";

import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import {
  closeTestsConnection,
  InnovatorService,
  setupTestsConnection,
} from "..";
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

  it("should instantiate the organisation service", async () => {
    expect(activityLogService).toBeDefined();
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

  it("should throw error when id is null in getInnovationActivitiesById()", async () => {
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
});
