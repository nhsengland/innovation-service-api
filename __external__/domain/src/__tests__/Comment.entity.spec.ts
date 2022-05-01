import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Innovation } from "../entity/innovation/Innovation.entity";
import { Comment } from "../entity/user/Comment.entity";
import { User } from "../entity/user/User.entity";
import { InnovationStatus } from "../enums/innovation.enums";
import { UserType } from "../enums/user.enums";

describe("Comment Test Suite", () => {
  let commentRepo: Repository<Comment>;
  let userRepo: Repository<User>;
  let innovationRepo: Repository<Innovation>;

  let innovation: Innovation;
  let innovatorUser: User;

  beforeAll(async () => {
    console.log(process.env.DB_TESTS_NAME);
    commentRepo = getRepository(Comment, process.env.DB_TESTS_NAME);
    innovationRepo = getRepository(Innovation, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);

    const userObj = User.new({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      name: "userDummy",
      type: UserType.INNOVATOR,
    });
    innovatorUser = await userRepo.save(userObj);

    const innovationObj = Innovation.new({
      name: "Innovation A",
      description: "My innovation description",
      countryName: "Wales",
      surveyId: "abc",
      owner: innovatorUser,
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    });
    innovation = await innovationRepo.save(innovationObj);
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

  describe("Comment Suite", () => {
    it("should create a Comment with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Comment);

      const commentObj = Comment.new({
        message: "myNewComment",
        user: innovatorUser,
        innovation,
      });
      const comment = await commentRepo.save(commentObj);

      const actual = await commentRepo.findOne(comment.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });

    it("should create a Comment with replies", async () => {
      // Arrange
      let commentObj = Comment.new({
        message: "myNewComment",
        user: innovatorUser,
        innovation,
      });
      const commentOne = await commentRepo.save(commentObj);

      commentObj = Comment.new({
        message: "myNewComment",
        replyTo: commentOne,
        user: innovatorUser,
        innovation,
      });
      const commentTwo = await commentRepo.save(commentObj);

      const actual = await commentRepo.findOne(commentTwo.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(actual.replyTo).toBe(commentOne.id);
    });
  });
});
