import { ActivityLog, UserRole } from "@domain/index";
import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Innovation } from "../entity/innovation/Innovation.entity";
import { InnovationSupport } from "../entity/innovation/InnovationSupport.entity";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationUnit } from "../entity/organisation/OrganisationUnit.entity";
import { User } from "../entity/user/User.entity";
import {
  InnovationStatus,
  InnovationSupportStatus,
} from "../enums/innovation.enums";
import { OrganisationType } from "../enums/organisation.enums";
import { UserType } from "../enums/user.enums";

describe("InnovationSupport Test Suite", () => {
  let innovationRepo: Repository<Innovation>;
  let userRepo: Repository<User>;
  let organisationRepo: Repository<Organisation>;
  let organisationUnitRepo: Repository<OrganisationUnit>;
  let innovationSupportRepo: Repository<InnovationSupport>;
  let organisationUnit: OrganisationUnit;
  let innovation: Innovation;

  beforeAll(async () => {
    innovationRepo = getRepository(Innovation, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);
    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
    organisationUnitRepo = getRepository(
      OrganisationUnit,
      process.env.DB_TESTS_NAME
    );
    innovationSupportRepo = getRepository(
      InnovationSupport,
      process.env.DB_TESTS_NAME
    );

    const userObj = User.new({
      id: "C7095D87-C3DF-46F6-A503-001B083F4630",
      type: UserType.INNOVATOR,
    });
    const user = await userRepo.save(userObj);

    const innovationObj = Innovation.new({
      name: "Innovation A",
      description: "My innovation description",
      countryName: "Wales",
      surveyId: "abc",
      owner: user,
      status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
    });

    innovation = await innovationRepo.save(innovationObj);

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
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(UserRole).execute();
    await query.from(ActivityLog).execute();
    await query.from(Innovation).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationSupport).execute();
  });

  describe("InnovationSupport Suite", () => {
    it("should create a InnovationSupport with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(InnovationSupport);

      const innovationSupportObj = InnovationSupport.new({
        organisationUnit,
        innovation,
        status: InnovationSupportStatus.UNASSIGNED,
      });
      const innovationSupport = await innovationSupportRepo.save(
        innovationSupportObj
      );

      const actual = await innovationSupportRepo.findOne(innovationSupport.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });
});
