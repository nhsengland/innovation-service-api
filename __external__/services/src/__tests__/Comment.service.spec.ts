import { getConnection } from "typeorm";
import { CommentService } from "../services/Comment.service";
import { Comment, Innovation, User } from "@domain/index";
import { InnovationService } from "../services/Innovation.service";
import { InnovatorService } from "../services/Innovator.service";

describe("Comment Service Suite", () => {
  let commentService: CommentService;
  let innovationService: InnovationService;
  let innovatorService: InnovatorService;
  let innovatorUser: User;
  let innovation: Innovation;

  beforeAll(async () => {
    commentService = new CommentService(process.env.DB_TESTS_NAME);
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
    await query.from(Comment).execute();
  });

  it("should instantiate the comment service", async () => {
    expect(commentService).toBeDefined();
  });

  it("should create a comment", async () => {
    const commentObj = Comment.new({
      message: "my New Comment",
      user: innovatorUser,
      innovation,
    });

    const comment = await commentService.create(commentObj);

    expect(comment).toBeDefined();
  });
});
