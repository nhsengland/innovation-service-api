import { ActivityLog } from "@domain/index";
import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { User } from "../entity/user/User.entity";
import { UserType } from "../enums/user.enums";

describe("User Test Suite", () => {
  let userRepo: Repository<User>;

  beforeAll(async () => {
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(ActivityLog).execute();
    await query.from(User).execute();
  });

  describe("User Suite", () => {
    it("should create an User with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(User);

      const userObj = User.new({
        id: "oid",
        name: "myNewUser",
        type: UserType.ACCESSOR,
      });
      const user = await userRepo.save(userObj);

      const actual = await userRepo.findOne(user.id);

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });
});
