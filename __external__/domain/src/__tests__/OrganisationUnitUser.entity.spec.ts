import { ActivityLog } from "@domain/index";
import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationUnit } from "../entity/organisation/OrganisationUnit.entity";
import { OrganisationUnitUser } from "../entity/organisation/OrganisationUnitUser.entity";
import { OrganisationUser } from "../entity/organisation/OrganisationUser.entity";
import { User } from "../entity/user/User.entity";
import {
  AccessorOrganisationRole,
  OrganisationType,
} from "../enums/organisation.enums";
import { UserType } from "../enums/user.enums";

describe("OrganisationUnitUser Test Suite", () => {
  let organisationRepo: Repository<Organisation>;
  let organisationUnitRepo: Repository<OrganisationUnit>;
  let organisationUserRepo: Repository<OrganisationUser>;
  let organisationUnitUserRepo: Repository<OrganisationUnitUser>;
  let userRepo: Repository<User>;
  let organisationUnit: OrganisationUnit;
  let organisationUser: OrganisationUser;

  beforeAll(async () => {
    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
    organisationUnitRepo = getRepository(
      OrganisationUnit,
      process.env.DB_TESTS_NAME
    );
    organisationUserRepo = getRepository(
      OrganisationUser,
      process.env.DB_TESTS_NAME
    );
    organisationUnitUserRepo = getRepository(
      OrganisationUnitUser,
      process.env.DB_TESTS_NAME
    );
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);

    const organisationObj = Organisation.new({
      name: "AccessorOrg",
      size: "huge",
      type: OrganisationType.ACCESSOR,
    });
    const organisation = await organisationRepo.save(organisationObj);

    const organisationUnitObj = OrganisationUnit.new({
      organisation,
      name: "New Unit",
    });
    organisationUnit = await organisationUnitRepo.save(organisationUnitObj);

    const userObj = User.new({
      id: "abc",
      type: UserType.ACCESSOR,
    });
    const user = await userRepo.save(userObj);

    const organisationUserObj = OrganisationUser.new({
      user,
      organisation,
      role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    });
    organisationUser = await organisationUserRepo.save(organisationUserObj);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(ActivityLog).execute();
    await query.from(OrganisationUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnitUser).execute();
  });

  describe("OrganisationUnitUser Suite", () => {
    it("should create an OrganisationUnitUser with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(OrganisationUnitUser);

      const organisationUnitUserObj = OrganisationUnitUser.new({
        organisationUnit,
        organisationUser,
      });
      const organisationUnitUser = await organisationUnitUserRepo.save(
        organisationUnitUserObj
      );

      const actual = await organisationUnitUserRepo.findOne(
        organisationUnitUser.id,
        { loadRelationIds: true }
      );

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });
});
