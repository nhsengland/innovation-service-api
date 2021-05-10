import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Notification } from "../entity/user/Notification.entity";
import { User } from "../entity/user/User.entity";
import { UserType } from "../enums/user.enums";

describe("Notification Test Suite", () => {
  let notificationRepo: Repository<Notification>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    notificationRepo = getRepository(Notification, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Notification).execute();
    await query.from(User).execute();
  });

  describe("Notification Suite", () => {
    it("should create an Notification with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Notification);

      const userObj = User.new({
        id: "oid",
        name: "userDummy",
        type: UserType.INNOVATOR,
      });
      const user = await userRepo.save(userObj);

      const notificationObj = Notification.new({
        message: "myNewNotification",
        user,
      });
      const notification = await notificationRepo.save(notificationObj);

      const actual = await notificationRepo.findOne(notification.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });
});
