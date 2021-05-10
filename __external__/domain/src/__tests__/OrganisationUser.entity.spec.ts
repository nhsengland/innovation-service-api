import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationUser } from "../entity/organisation/OrganisationUser.entity";
import { User } from "../entity/user/User.entity";
import {
  InnovatorOrganisationRole,
  OrganisationType,
} from "../enums/organisation.enums";
import { UserType } from "../enums/user.enums";

describe("OrganisationUser Test Suite", () => {
  let organisationUserRepo: Repository<OrganisationUser>;
  let organisationRepo: Repository<Organisation>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    organisationUserRepo = getRepository(
      OrganisationUser,
      process.env.DB_TESTS_NAME
    );
    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  describe("OrganisationUser Suite", () => {
    it("should create an OrganisationUser with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(OrganisationUser);

      const userObj = User.new({
        id: "oid",
        name: "userDummy",
        type: UserType.INNOVATOR,
      });
      const user = await userRepo.save(userObj);

      const organisationObj = Organisation.new({
        name: "my org name",
        size: "huge",
        type: OrganisationType.INNOVATOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const organisationUserObj = OrganisationUser.new({
        user,
        organisation,
        role: InnovatorOrganisationRole.INNOVATOR_OWNER,
      });
      const organisationUser = await organisationUserRepo.save(
        organisationUserObj
      );

      const actual = await organisationUserRepo.findOne(organisationUser.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });
});
