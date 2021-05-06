import { getConnection } from "typeorm";
import { ActionService } from "../services/Action.service";
import { InnovationAction, Innovation, User } from "@domain/index";
import { InnovationService } from "../services/Innovation.service";
import { InnovatorService } from "../services/Innovator.service";

describe.skip("Action Service Suite", () => {
  let actionService: ActionService;
  let innovationService: InnovationService;
  let innovatorService: InnovatorService;
  let innovatorUser: User;
  let innovation: Innovation;

  beforeAll(async () => {
    actionService = new ActionService(process.env.DB_TESTS_NAME);
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);

    const innovator = new User();
    innovator.id = "myIdTest";
    innovatorUser = await innovatorService.create(innovator);

    const innovationObj: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    innovation = await innovationService.create(innovationObj);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(Innovation).execute();
    await query.from(User).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(InnovationAction).execute();
  });

  it("should instantiate the action service", async () => {
    expect(actionService).toBeDefined();
  });

  it("should create an action", async () => {
    const commentObj = InnovationAction.new({
      message: "myNewInnovationAction",
      assignTo: innovatorUser,
      innovation,
    });

    const comment = await actionService.create(commentObj);

    expect(comment).toBeDefined();
  });
});
